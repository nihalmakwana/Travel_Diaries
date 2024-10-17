import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { upload } from "../middlewares/multer.middleware.js"
import { 
    addTravelStory,
    deleteStory,
    editStory,
    filterStories,
    getAllStories,
    getCurrentUser,
    loginUser, 
    logoutUser, 
    registerUser, 
    searchStory, 
    updateIsFavourite
} from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//Secure Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/get-user").get(verifyJWT, getCurrentUser)
router.route("/add-travel-story").post(
    verifyJWT,
    upload.single("imageUrl"), 
    addTravelStory
)
router.route("/get-all-stories").get(verifyJWT, getAllStories)
router.route("/edit-story").post(verifyJWT, editStory)
router.route("/delete-story/:id/:userId").delete(verifyJWT, deleteStory)
router.route("/update-is-favourite/:id").post(verifyJWT, updateIsFavourite)
router.route("/search-story/:userId").post(verifyJWT, searchStory)
router.route("/filter-stories/:userId").get(verifyJWT, filterStories)

export default router