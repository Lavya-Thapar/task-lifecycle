import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { createTask, updateTask } from "../controllers/task.controllers.js";

const taskRouter = Router()

taskRouter.route("/create-task").post(verifyJWT, createTask)
taskRouter.route("/update-task/:taskId").post(verifyJWT,updateTask)

export default taskRouter