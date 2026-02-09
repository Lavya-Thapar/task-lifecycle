import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middlewares.js";

const app = express()

app.set("trust proxy", 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "16kb",

}))

app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

import userRouter from "./routes/user.routes.js";
import taskRouter from "./routes/task.routes.js";

app.use("/api/v1/users",userRouter)
app.use("/api/v1/tasks",taskRouter)

app.use(errorHandler);

export default app