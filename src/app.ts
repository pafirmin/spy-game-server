import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Player } from "./interfaces/socket-data.interface";
import { Card } from "./interfaces/card.interface";
import Room from "./classes/room.class";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  Player
>(server);

const PORT = process.env.PORT;

const rooms = new Map<string, Room>();

io.on("connection", (socket) => {
  socket.on("create", (data, socket) => {
    if (!rooms.has(data.room)) {
      const newRoom = new Room(data.room);

      newRoom.addPlayer(data);
    }

    socket.join(data.room);
  });

  socket.on("join", (data, socket) => {
    const room = rooms.get(data.room);

    if (room) {
      room.addPlayer(data);

      io.to(data.room).emit("newUserJoined", room);
    } else {
      socket.emit("roomNotFound");
    }
  });

  socket.on("reveal", (data: { card: Card; player: Player }) => {
    const room = rooms.get(data.player.room);

    if (room) {
      room.revealCard(data.card);

      io.to(data.player.room).emit("cardRevealed", room);
    }
  });
});

server.listen(3000, () => {
  console.log(`Server listening on port ${PORT}`);
});
