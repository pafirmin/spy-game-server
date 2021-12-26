import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Player } from "./interfaces/socket-data.interface";
import { Card } from "./interfaces/card.interface";
import Game from "./classes/room.class";
import { GameErrorTypes } from "./enums/game-error-types.enum";

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

const games = new Map<string, Game>();

io.on("connection", (socket) => {
  socket.on("create", (data, socket) => {
    if (games.has(data.room)) {
      socket.emit("gameError", {
        type: GameErrorTypes.GAME_NAME_TAKEN,
        message: `Name ${data.room} is already in use!`,
      });
    }
    const newGame = new Game(data.room);
    newGame.addPlayer(data);

    socket.join(data.room);
    io.to(data.room).emit("newUserJoined", newGame);
  });

  socket.on("join", (data, socket) => {
    const game = games.get(data.room);

    if (game) {
      game.addPlayer(data);

      io.to(data.room).emit("newUserJoined", game);
    } else {
      socket.emit("gameError", {
        type: GameErrorTypes.GAME_NOT_FOUND,
        message: "Game not found",
      });
    }
  });

  socket.on("reveal", (data: { card: Card; player: Player }) => {
    const game = games.get(data.player.room);

    if (game) {
      game.revealCard(data.card);

      if (game.checkForWin()) {
        game.revealAll();
        io.to(data.player.room).emit("gameOver", game);
      } else {
        io.to(data.player.room).emit("cardRevealed", game);
      }
    }
  });

  socket.on("assignSpyMaster", (data: Player) => {
    const game = games.get(data.room);

    if (game) {
      const err = game.assignSpyMaster(data);

      if (err) {
        socket.emit("gameError", err);
      } else {
        io.to(data.room).emit("spymasterAssigned", game);
      }
    }
  });

  socket.on("reset", (data) => {
    const game = games.get(data.room);

    if (game) {
      game.reset();
      io.to(data.room).emit("newGame", game);
    }
  });
});

server.listen(3000, () => {
  console.log(`Server listening on port ${PORT}`);
});
