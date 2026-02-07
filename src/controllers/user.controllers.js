import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiErrors.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"

const generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false}) // this means do not ask for other fields like password, before saving , we are just adding tokens 
        return {accessToken, refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    
    const {fullname,username,email,password} = req.body
    
    if([fullname,username,email,password].some((field)=>{
        return (field?.trim==="");
    }))
    {
        throw new ApiError(400,"All fields is required")
    }

    const existedUser= await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser)
    {
        throw new ApiError(409,"User with email or username already exists")
    }

     
    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registering the user !")

    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully!",)
    )
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
    try {
        const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken)
        {
            throw new ApiError(401, "No incoming token found")
        }
    
        const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        if(!user)
        {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken)
        {
            throw new ApiError(401, "Rerfresh token is expired!")
        }
    
        const options = {
            httpOnly: true,
            secure: true,
            //when these 2 are true, cookies are only modifiable through server
        }
    
        const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
        return res.status(200).cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse
            (
                200,
                {
                accessToken,refreshToken
                },
                "Access token refreshed!"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }


})

const loginUser = asyncHandler(async (req,res)=>{

    const {identifier,password} = req.body

    if(!identifier)
    {
        throw new ApiError(400,"username or password is required");
    }

    const user = await User.findOne({
        $or: [{username: identifier},{email: identifier}] // either find on the basis of username OR on basis of email
    })

    if(!user)
    {
        throw new ApiError(404,"User is not registered");
    }

    const isPassValid= await user.isPasswordCorrect(password);

    if(!isPassValid)
    {
        throw new ApiError(401,"Password is incorrect");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-refreshToken -password");
    
    const options = {
        httpOnly: true,
        secure: true,
        //when these 2 are true, cookies are only modifiable through server
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200,
            {user: loggedInUser, refreshToken, accessToken},// we are sending this here in case user want to save their tokens 
            "User logged in successfully!"
        )
    )

})

const logoutUser = asyncHandler(async (req,res)=>{
    //cookies should be cleared
    await User.findByIdAndUpdate(req.user._id, 
        {
            $set: {refreshToken: undefined},
        },
        {
            new: true // this is needed so that mongoose returns the object after updating it in DB
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        //when these 2 are true, cookies are only modifiable through server
    }

    return res.status(200).clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out!"))

})

export {generateAccessAndRefreshToken, 
    registerUser,
    refreshAccessToken,
    loginUser,
    logoutUser
}