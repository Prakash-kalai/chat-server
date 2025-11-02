import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());

const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // Store messages per room

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // ✅ Join room
  socket.on("join", ({ username, room }) => {
    console.log("Joined:", username, room);

    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];

    // send chat history
    socket.emit("history", rooms[room]);
  });

  // ✅ New message
  socket.on("message", (msg) => {
    if (!rooms[msg.room]) rooms[msg.room] = [];
    rooms[msg.room].push(msg);

    io.to(msg.room).emit("message", msg);
    console.log("New Message:", msg);
  });

  // ✅ Edit message
  socket.on("edit-message", (msg) => {
    const room = rooms[msg.room];
    if (!room) return;

    const index = room.findIndex((m) => m.id === msg.id);
    if (index !== -1) room[index] = msg;

    io.to(msg.room).emit("edit-message", msg);
  });

  // ✅ Delete message
  socket.on("delete-message", ({ id, room }) => {
    if (rooms[room]) {
      rooms[room] = rooms[room].filter((m) => m.id !== id);
    }
    io.to(room).emit("delete-message", id);
  });

  // ✅ Typing indicator
  socket.on("typing", ({ user, room, isTyping }) => {
    socket.to(room).emit("typing", { user, isTyping });
  });

  // ✅ Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 4000, () => {
  console.log("✅ Chat Server running on port 4000");
});
