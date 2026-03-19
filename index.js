const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
app.get("/", (req, res) => {
  res.send("Hello world from socket server!");
});

let users = [];

const addUser = (userId, socketId) => {
  users = users.filter((u) => u.userId !== userId);
  users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((u) => u.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((u) => u.userId === userId);
};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("addUser", (userId) => {
    socket.userId = userId;
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("sendMessage", (data) => {
    const receiver = getUser(data.receiverId);

    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", {
        senderId: data.senderId,
        text: data.text,
        images: data.images,
        conversationId: data.conversationId,
        createdAt: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

server.listen(4000, () => {
  console.log("🚀 Socket server running on port 4000");
});
