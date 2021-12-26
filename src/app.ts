import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { SocketData } from "./interfaces/socket-data.interface";
import { Teams } from "./enums/teams.enum";
import { Card } from "./interfaces/card.interface";
import { RoomData } from "./interfaces/room-data.interface";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>(server);

const PORT = process.env.PORT;

const rooms = new Map<string, RoomData>();

io.on("connection", (socket) => {
  socket.on("create", (data, socket) => {
    if (!rooms.has(data.room)) {
      rooms.set(data.room, { cards: [], players: [data] });
    }

    socket.join(data.room);
  });

  socket.on("join", (data, socket) => {
    const room = rooms.get(data.room);

    if (room) {
      const newRoomData: RoomData = {
        ...room,
        players: [...room.players, data],
      };
      socket.join(data.room);
      rooms.set(data.room, newRoomData);

      io.to(data.room).emit("newUserJoined", newRoomData);
    } else {
      socket.emit("roomNotFound");
    }
  });
});

server.listen(3000, () => {
  console.log(`Server listening on port ${PORT}`);
});
