import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"

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

export {
    registerUser
}