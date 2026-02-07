import { Router } from "express";
import { registerUser, refreshAccessToken, loginUser, logoutUser} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router()

userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("refreshToken").post(refreshAccessToken)


export default userRouter