import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import { 
    getCurrentUser,
    loginUser, 
    logoutUser, 
    registerUser 
} from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)

//Secure Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/get-user").get(verifyJWT, getCurrentUser)

export default router