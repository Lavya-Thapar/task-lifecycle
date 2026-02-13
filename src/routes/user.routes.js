import { Router } from "express";
import { registerUser, refreshAccessToken, loginUser, logoutUser, fetchUserTasks, fetchUserDetails} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const userRouter = Router()

userRouter.get("/me", verifyJWT, (req, res) => {
  res.status(200).json({
    user: req.user
  });
});

userRouter.route("/register").post(registerUser)
userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJWT,logoutUser)
userRouter.route("/refreshToken").post(refreshAccessToken)
userRouter.route("/get-tasks").get(verifyJWT, fetchUserTasks)
userRouter.route("/fetch-details").get(verifyJWT, fetchUserDetails)

export default userRouter