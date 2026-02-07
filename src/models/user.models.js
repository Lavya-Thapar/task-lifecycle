import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

//bcrypt is used for hashing passwords
//jwt is a url safe way to transmit information

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true, // for searching purposes
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true, // for searching purposes
    },
    password: {
        type: String,
        required: [true,'Password is required'],// default message in case password not provided

    },
    refreshToken: {
        type: String
    },
    tasks:[
        {
            type: Schema.Types.ObjectId,
            ref: "Task"
        }
    ],

},{timestamps: true});


// before saving any information about user, do the hashing of password
userSchema.pre("save",async function (next){ 
    if(!this.isModified("password")){
        return;
    }
    this.password = await bcrypt.hash(this.password,10)
    
})

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

export const User = mongoose.model("User",userSchema)