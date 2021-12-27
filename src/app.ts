import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { Player } from "./interfaces/socket-data.interface";
import { Card } from "./interfaces/card.interface";
import Game from "./classes/game/game.class";
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
  socket.on("create", (roomName) => {
    if (games.has(roomName)) {
      socket.emit("gameError", {
        type: GameErrorTypes.GAME_NAME_TAKEN,
        message: `Name ${roomName} is already in use!`,
      });

      return;
    }

    const newGame = new Game(roomName);
    games.set(roomName, newGame);

    socket.emit("gameCreated", newGame);
  });

  socket.on("join", (data) => {
    socket.data.name = data.name;
    socket.data.room = data.room;

    const game = games.get(data.room);

    if (game) {
      const [err, player] = game.addPlayer(data);

      if (err) {
        socket.emit("gameError", err);

        return;
      }

      socket.join(data.room);
      socket.emit("gameJoined", game);
      socket.to(data.room).emit("newUserJoined", player);
    } else {
      socket.emit("gameError", {
        type: GameErrorTypes.GAME_NOT_FOUND,
        message: "Game not found",
      });
    }
  });

  socket.on("startGame", (data: Player) => {
    const game = games.get(data.room);

    if (game) {
      const err = game.startGame();

      if (err) {
        socket.emit("gameError", err);

        return;
      }

      io.to(data.room).emit("gameStarted");
    }
  });

  socket.on("reveal", (data: { card: Card; player: Player }) => {
    const game = games.get(data.player.room);

    if (game) {
      const card = game.revealCard(data.card);

      if (game.checkForWin()) {
        game.revealAll();
        io.to(data.player.room).emit("gameOver", game);
      } else {
        io.to(data.player.room).emit("cardRevealed", card);
      }
    }
  });

  socket.on("assignSpyMaster", (data: Player) => {
    const game = games.get(data.room);

    if (game) {
      const [err, spymaster] = game.assignSpyMaster(data);

      if (err) {
        socket.emit("gameError", err);
      } else {
        io.to(data.room).emit("spymasterAssigned", spymaster);
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

  socket.on("disconnect", () => {
    const game = games.get(socket.data.room);

    if (game) {
      game.removePlayer(socket.data.name);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
