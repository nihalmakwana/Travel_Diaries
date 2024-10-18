import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { TravelStory } from "../models/travelStory.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const option = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh token...")
    }
}

const registerUser = asyncHandler( async (req, res) => {
    // get user details from frontend
    const {email, fullname, password} = req.body
    
    // validation - not empty
    if (!email || !fullname || !password) {
        throw new ApiError(400, "All Fields are Required...")
    }

    // check if user already exists: email
    const existingUser = await User.findOne({ email })
    if (existingUser) {
        throw new ApiError(409, "User with email is already exists")
    }

    // create user object - create entry in db 
    const user = await User.create({
        fullname,
        email, 
        password
    })

    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    // check for user creation 
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User Registered Successfully !!!")
    )

} )

const loginUser = asyncHandler( async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        throw new ApiError(400, "All fileds are Required...")
    }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(400, "User Does not Exists...")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid User Creadentials...")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User Logged In Successfully!!!")
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )
})

const getCurrentUser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current User Fetched..")
    )
})

const addTravelStory = asyncHandler( async (req, res) => {
    const { title, story, visitedLocation, visitedDate } = req.body
    const { _id } = req.user
    
    if (!title || !story || !visitedLocation || !visitedDate) {
        throw new ApiError(400, "All fields are required...")
    }

    const imageLocalPath = req.file?.path
    
    if (!imageLocalPath) {
        throw new ApiError(400, "Image is Required...")
    }

    const image = await uploadOnCloudinary(imageLocalPath)
    if (!image) {
        throw new ApiError(400, "Image local path is Required...")
    }

    try {
        const travelStory = new TravelStory({
            userId: _id,
            title,
            story,
            visitedLocation, 
            imageUrl: image.url, 
            visitedDate
        })

        await travelStory.save()

        return res
        .status(200)
        .json(
            new ApiResponse(200, travelStory, "Story Added Successfully!!!")
        )

    } catch (error) {
        throw new ApiError(400, error?.message)
    }
})

const getAllStories = asyncHandler( async (req, res) => {
    const { _id } = req.user
    
    try {
        const travelStories = await TravelStory.find({ userId: _id }).sort({ isFavourite: -1})

        return res
        .status(200)
        .json(
            new ApiResponse(200, travelStories, "Get All Stories successfully...")
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while get stories")
    }
})

const editStory = asyncHandler( async (req, res) => {
    const { id, userId, title, story, visitedLocation, imageUrl, visitedDate } = req.body

    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        throw new ApiError(400, "All Fields are required...")
    }

    const parseVisitedDate = new Date(parseInt(visitedDate))

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId })

        if (!travelStory) {
            throw new ApiError(404, "Travel Story not found...")
        }

        const placeHolderImage = "https://lh3.googleusercontent.com/gg/ACM6BItGHs88HrzXHQAZQVl25ZboSLilga2E89Yu-exQpGhkFb9Pq1FvwgWhtQurcR9RFdVYiSJsleqKBkfcY7czFfsDFbmj1Akbi8FhiJ2l-W1foVAR-ZIXoJg9qxGTUFxar-h963oaRrQK5sV8tkOIKKNTeQzHNaaBgJsk0i8OqDTSUMB2wLs"

        travelStory.title = title
        travelStory.story = story
        travelStory.visitedLocation = visitedLocation
        travelStory.imageUrl = imageUrl || placeHolderImage
        travelStory.visitedDate = parseVisitedDate

        await travelStory.save()

        return res 
        .status(200)
        .json(
            new ApiResponse(200, travelStory, "Story Update Successfully...")
        )

    } catch (error) {
        throw new ApiError()
    }
})

const deleteStory = asyncHandler( async (req, res) => {
    const { id, userId } = req.params

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: userId })

        if (!travelStory) {
            throw new ApiError(404, "Story not found...")
        }

        await travelStory.deleteOne({ id: id, userId: userId })
        
        return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Story Deleted Successfully...")
        )
    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong whilte deleting story")
    }
})

const updateIsFavourite = asyncHandler( async (req, res) => {
    const { id } = req.params
    const { isFavourite } = req.body
    const { _id } = req.user

    try {
        const travelStory = await TravelStory.findOne({ _id: id, userId: _id })

        if (!travelStory) {
            throw new ApiError(404, "Story not found")
        }

        travelStory.isFavourite = isFavourite

        await travelStory.save()

        return res
        .status(200)
        .json(
            new ApiResponse(200, travelStory, "isFavourite updated successfully...")
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "Something went wrong while update isFavourite")
    }
})

const searchStory = asyncHandler( async (req, res) => {
    const { query } = req.query
    const { userId } = req.body

    if (!query) {
        throw new ApiError(401, "Query is required")
    }

    try {
        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" }},
                { story: { $regex: query, $options: "i" }},
                { visitedLocation: { $regex: query, $options: "i" }}
            ]
        }).sort({ isFavourite: -1 })

        return res
        .status(200)
        .json(
            new ApiResponse(200, searchResults, "Serching Successfully...")
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "Can't Search..")
    }
})   // Not searching  

const filterStories = asyncHandler( async (req, res) => {
    const { startDate, endDate } = req.query
    const { userId } = req.params

    try {
        const start = new Date(parseInt(startDate))
        const end = new Date(parseInt(endDate))

        const filterStories = await TravelStory.find({
            userId: userId,
            visitedDate: { $gte: start, $lte: end }
        }).sort({ isFavourite: -1 })

        return res
        .status(200)
        .json(
            new ApiResponse(200, filterStories, "Stories Filtered....")
        )

    } catch (error) {
        throw new ApiError(500, error?.message || "Can't Filters Stories..")
    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    addTravelStory,
    getAllStories,
    editStory,
    deleteStory,
    updateIsFavourite,
    searchStory,
    filterStories
}