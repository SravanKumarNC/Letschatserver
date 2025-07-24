import express from "express";
import http from "http";
import { Server } from "socket.io";
import env from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import Chat from "./models/chatModel.js";

env.config();
connectDB();
const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://192.168.105.18:5173",
      "http://192.168.1.7:5173",
      "http://192.168.1.8:5173",
      "http://192.168.1.4:5173",
      "http://192.168.1.5:5173",
      "http://192.168.190.18:5173",
    ],
    credentials: true,
  })
);
const io = new Server(server, {
  pingTimeout: 5000,
  cors: {
    origin: "*",
  },
});
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;
const userSocketMap = new Map();

io.on("connection", (socket) => {
  socket.on("setup", async (userData) => {
    console.log("connected to socket.io", userData._id, userData.name);
    socket.join(userData._id);
    userSocketMap.set(userData._id, socket.id);
    console.log(userSocketMap)
    socket.emit("connected");
    try {
      // Find all chats where this user is a participant
      const userChats = await Chat.find({ users: userData._id }).select("_id");
      console.log("joined chatrooms", userChats);
      // Join each chat room by chatId
      userChats.forEach((chat) => {
        socket.join(chat._id.toString());
      });
    } catch (error) {
      console.error("Failed to join chat rooms:", error.message);
    }
  });

  socket.on("join chat", (room) => {
    socket.join(room);
  });

  socket.on("new message", (newMessageRecived) => {
    var chat = newMessageRecived.chat;
    if (!chat.users) return console.log(`chat.users not found`);

    chat.users.forEach((user) => {
      if (user._id == newMessageRecived.sender._id) return;
      socket.in(user._id).emit("message recived", newMessageRecived);
    });
  });
  socket.on("typing", (data) => {
    console.log("typing", data);
    socket.in(data.room).emit("typing", {
      room: data.room,
      user: data.user,
    });
  });
  socket.on("stop typing", (data) => {
    socket.in(data.room).emit("stop typing", data);
  });

  socket.on("call-user", ({ targetUserId, offer, caller }) => {
    console.log("Received call-user event for targetUserId:", targetUserId, "from:", caller.id);
    const targetSocketId = userSocketMap.get(targetUserId);
    console.log("Target Socket ID:", targetSocketId);
    if (targetSocketId) {
      console.log("Emitting incoming-call to:", targetSocketId, "with offer:", offer, "caller:", caller);
      io.to(targetSocketId).emit("incoming-call", { offer, caller });
    }
  });

  socket.on("answer-call", ({ targetUserId, answer }) => {
    console.log("Received answer-call event for targetUserId:", targetUserId, "answer:", answer);
    const targetSocketId = userSocketMap.get(targetUserId); // Here, targetUserId is the caller's ID
    console.log("Caller Socket ID:", targetSocketId);
    if (targetSocketId) {
      console.log("Emitting call-answered to:", targetSocketId, "with answer:", answer);
      io.to(targetSocketId).emit("call-answered", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    console.log("ice-candidate", to);
    const toSocketId = userSocketMap.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit("ice-candidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    console.log("user Disconnected", socket.id);

    for (const [userId, sId] of userSocketMap.entries()) {
      if (sId == -socket.id) {
        userSocketMap.delete(userId);
        break;
      }
    }
  });

  socket.off("setup", () => {
    console.log("User Disconnected");
    socket.leave(userData._id);
  });
});

server.listen(PORT, console.log(`Server Started on PORT: ${PORT}`));
