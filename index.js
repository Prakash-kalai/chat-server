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

const rooms = {}; 

io.on("connection", (socket) => {
  socket.on("join", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;
    if (!rooms[room]) rooms[room] = [];
    socket.emit("history", rooms[room]);
  });

  socket.on("message", (msg) => {
    rooms[msg.room] = [...(rooms[msg.room] || []), msg];
    io.to(msg.room).emit("message", msg);
  });

  socket.on("edit-message", (msg) => {
    const room = rooms[msg.room];
    if (!room) return;
    const index = room.findIndex((m) => m.id === msg.id);
    if (index !== -1) room[index] = msg;
    io.to(msg.room).emit("edit-message", msg);
  });

  socket.on("delete-message", ({ id, room }) => {
    rooms[room] = (rooms[room] || []).filter((m) => m.id !== id);
    io.to(room).emit("delete-message", id);
  });

  socket.on("typing", ({ user, room, isTyping }) => {
    socket.to(room).emit("typing", { user, isTyping });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(4000, () => console.log("🚀 Server running on http://localhost:4000"));
