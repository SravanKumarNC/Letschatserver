import mongoose from "mongoose";
import bcrypt from "bcryptjs"

const userSchema = mongoose.Schema({
    name : {
        type: String, 
        required: true
    },
    email : {
        type : String,
        required: true,
        unique:true
    },
    password : {
        type : String,
        required: true
    },
    pic: {
        type: String,
        default: "https://static.thenounproject.com/png/65476-200.png"
    }

},{
    timestamps : true 
})

userSchema.methods.matchPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.pre("save", async function (next) {
    if(!this.isModified){
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

const User =  mongoose.model("User", userSchema);
export default User;