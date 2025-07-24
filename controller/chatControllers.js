import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import User from "../models/userModel.js";

export const accessChat = asyncHandler(async(req, res) => {
    const {userId} = req.body;

    if(!userId){
        console.log("UserId param not sent with request");
        return res.status(400).json({ message: "UserId param is required" });
    }

    let isChat = await Chat.find({
        isGroupChat : false,
        $and : [
            {users : {$elemMatch : {$eq: req.user._id}}},
            {users : {$elemMatch : {$eq: userId}}},
        ]
    }).populate("users","-password").populate("latestMessage");
    isChat = await User.populate(isChat, {
        path: "latestMessage.sender",
        select: "name pic email"
    })
    if(isChat.length > 0){
        res.send(isChat[0]);
    }else{
        let chatData = {
            chatName : "sender",
            isGroupChat: false,
            users: [req.user._id, userId]
        };
        try {
            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({_id: createdChat._id}).populate("users", "-password");
            res.status(200).send(FullChat)
        } catch (error) {
            res.status(400);
            throw new Error(error.message)
        }
    }
})

export const fetchChats = asyncHandler(async(req, res)=>{
    try {
        Chat.find({
            users: {$elemMatch: {$eq: req.user._id}},
        })
        .populate("users", "-password")
        .populate("groupAdmin", "-password")
        .populate("latestMessage")
        .sort({updatedAt: -1})
        .then(async (results) => {
            results = await User.populate(results, {
                path: "latestMessage.sender",
                select: "name pic email"
            })
            res.status(200).send(results);
        })
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
})

export const createGroup = asyncHandler(async(req, res) => {
    if(!req.body.users || !req.body.name){
        return res.status(400).send({message: "Please fill all the feilds"});
    }

    let users = JSON.parse(req.body.users);
    if(users.lenght < 2) {
        return res
            .status(400)
            .send({message : "More than 2 users are required to form users"});
    }
    users.push(req.user);
    try{
        const groupChat = await Chat.create({
            chatName : req.body.name,
            users: users,
            isGroupChat: true,
            groupAdmin : req.user,
        })
        const fullGroupChat = await Chat.findOne({_id : groupChat._id})
            .populate("users", "passwords")
            .populate("groupAdmin", "-password");
        res.send(200).json(fullGroupChat);
    }catch(error){
        res.send(400)
        throw new Error(error.message)
    }
})

export const renameGroup = asyncHandler(async(req,res) => {
    const {chatId, chatName} = req.body;

    const updatedChat = await Chat.findOneAndUpdate(
        chatId, {chatName},{new: true}
    )
        .populate("users","-password")
        .populate("groupAdmin", "-password");
      
    if(!updatedChat){
        res.status(404)
        throw new Error("Chat Not Found");
    }else{
        res.json(updatedChat);
    }
})

export const addToGroup = asyncHandler(async(req,res) => {
    const {chatId, userId} = req.body;

    const added =await Chat.findByIdAndUpdate(chatId, {$push : {users: userId}},{new : true})
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
    if(!added){
        res.send(400)
        throw new Error("Chat not found")
    }else{
        res.json(added);
    }
})

export const removeFromGroup = asyncHandler(async(req,res) => {
    const {chatId, userId} = req.body;

    const removed = await Chat.findByIdAndUpdate(chatId, {$pull : {users: userId}},{new : true})
        .populate("users", "-password")
        .populate("groupAdmin", "-password");
    if(!added){
        res.send(400)
        throw new Error("Chat not found")
    }else{
        res.json(removed);
    }
})