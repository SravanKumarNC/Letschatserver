import asyncHandler from "express-async-handler";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Chat from "../models/chatModel.js";

// export const sendMessage = asyncHandler(async(req,res) => {
//     const {content, chatId} = req.body;
//     if(!content || !chatId){
//         console.log("Invalid data passed into the request");
//         return res.sendStatus(400);
//     }
//     let newMessage = {
//         sender : req.user._id,
//         content : content,
//         chat: chatId
//     }
//     try {
//         let message = await Message.create(newMessage);
//         message = await message.populate("sender", "name pic");
//         message = await message.populate("chat");
//         message = await User.populate(message, {
//             path : "chat.users",
//             select : "name pic email",
//         });

//         await Chat.findByIdAndUpdate(req.body.chatId,{
//             latestMessage : message,
//         })
//         res.json(message);
//     } catch (error) {
//         res.status(400)
//         throw new Error(error.message);
//     }
// });

export const sendMessage = asyncHandler(async (req, res) => {
    const { content, chatId } = req.body;
  
    if (!content || !chatId) {
      console.log("Invalid data passed into the request");
      return res.sendStatus(400);
    }
    console.log(chatId);
  
    try {
      const newMessage = {
        sender: req.user._id,
        content,
        chat: chatId, // you already verified this is a valid id
      };
  
      let message = await Message.create(newMessage);
  
      // Properly populate the sender and chat + nested users
      message = await Message.findById(message._id)
        .populate("sender", "name pic")
        .populate({
          path: "chat",
          populate: {
            path: "users",
            select: "name pic email",
          },
        });
  
      await Chat.findByIdAndUpdate(chatId, {
        latestMessage: message,
      });
  
      res.status(200).json(message);
    } catch (error) {
      console.error("Error in sendMessage:", error);
      res.status(400);
      throw new Error(error.message);
    }
  });

export const allMessages = asyncHandler(async(req, res) => {
    try {
        const messages = await Message.find({chat : req.params.chatId}).populate(
            "sender",
            "name pic email"
        ).populate('chat');
        res.json(messages);
    } catch (error) {
        res.send(400)
        throw new Error(error.message);
    }
})