import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiErrors.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Task } from "../models/task.models.js"
import { calculatePriorityFromDueDate } from "../utils/calculatePriority.js"

const createTask = asyncHandler(async (req, res) => {
    const { title, description, dueDate, status, priority } = req.body;

    //Basic validation
    if (!title || !description || !dueDate) {
      throw new ApiError(400, "title, description and dueDate are required!")
    }

    const parsedDueDate = new Date(dueDate);

    if (isNaN(parsedDueDate.getTime())) {
      throw new ApiError(400,"invalid due date!")
    }

    if (parsedDueDate <= new Date()) {
      throw new ApiError(400, "due date must be in future!")
    }

    //Determine priority logic
    let finalPriority;
    let prioritySource;

    if (priority) {
      // MANUAL set
      finalPriority = priority;
      prioritySource = "MANUAL";
    } else {
      // AUTO set
      finalPriority = calculatePriorityFromDueDate(parsedDueDate);
      prioritySource = "AUTO";
    }

    //Create task
    const task = await Task.create({
      title,
      description,
      dueDate: parsedDueDate,
      status: status || "Pending",
      priority: finalPriority,
      prioritySource,
      userId: req.user?._id
    });

    const createdTask = await Task.findById(task._id)
    if(!createdTask)
    {
        throw new ApiError(500,"could not create task!")
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdTask,
            "task created successfully!"
        )
    )
});

const updateTask = asyncHandler(async (req,res)=>{
    const {taskId} = req.params;
    const {title, description, status, dueDate, priority} = req.body;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
            throw new ApiError(400, "Invalid task Id");
    }

    const task = await Task.findById(taskId);
    
    if(!task)
    {
        throw new ApiError(404, "task not found!")
    }

    if(task.userId.toString()!== req.user?._id.toString())
    {
        throw new ApiError(403, "you are not authorised to update this task!")
    }

    if(!title && !description && !status && !dueDate && !priority)
    {
        throw new ApiError(400," some field must be present for updation!")
    }

    let isDueDateActuallyChanged = false;

    if(dueDate) {
        const parsedDueDate = new Date(dueDate);
        if (isNaN(parsedDueDate.getTime())) {
            throw new ApiError(400,"invalid due date!")
        }
        
        if (task.dueDate.toISOString() !== parsedDueDate.toISOString()) {
             // Only throw 'future' error if it is a NEW date
             if (parsedDueDate <= new Date()) {
                  throw new ApiError(400, "due date must be in future!")
             }
             task.dueDate = parsedDueDate;
             isDueDateActuallyChanged = true;
        }
    }

    //const isDueDateUpdated = Boolean(dueDate);
    const isPriorityProvided = Boolean(priority);

    if (title !== undefined) {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            throw new ApiError(400, "Title cannot be empty");
        }
        task.title = trimmedTitle;
    }

    if (description !== undefined) {
        const trimmedDescription = description.trim();
        if (!trimmedDescription) {
            throw new ApiError(400, "description cannot be empty");
        }
        task.description = trimmedDescription;
    }

    if (status) {
        if(!["Pending", "In progress", "Completed"].includes(status))
            throw new ApiError(400, "Invalid status value");
        else
        {
            task.status=status
        }
    }

    // PRIORITY LOGIC 
    if (isPriorityProvided) {
        // Manual override
        if (!["Low", "Medium", "High"].includes(priority)) {
            throw new ApiError(400, "Invalid priority value");
        }
        task.priority = priority;
        task.prioritySource = "MANUAL";

    } else if (isDueDateActuallyChanged) {
        // Resume AUTO mode if due date changes
        task.priority = calculatePriorityFromDueDate(task.dueDate);
        task.prioritySource = "AUTO";
    }

    await task.save();

    return res.status(201).json(
        new ApiResponse(
            201,
            task,
            "task updated successfully!"
        )
    )
})

const deleteTask = asyncHandler(async (req,res)=>{
    const {taskId} = req.params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
        throw new ApiError(400, "Invalid task Id");
    }

    const task = await Task.findById(taskId);
    
    if(!task)
    {
        throw new ApiError(404, "task not found!")
    }

    if(task.userId.toString()!== req.user?._id.toString())
    {
        throw new ApiError(403, "you are not authorised to delete this task!")
    }

    await task.deleteOne();

    return res.status(200).json(
        new ApiResponse(200,
            {},
            "Task deleted successfully!"
        )
    )

})




export {
    createTask,
    updateTask,
    deleteTask
}