import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { SocketData } from "./interfaces/socket-data.interface";
import { Card } from "./interfaces/card.interface";
import Game from "./classes/game/game.class";
import { GameErrorTypes } from "./enums/game-error-types.enum";
import Player from "./classes/player/player.class";
import { CreatePlayerDTO } from "./dtos/create-player.dto";
import { PlayerDTO } from "./dtos/player.dto";

dotenv.config();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
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
    socket.emit("gameCreated", newGame.name);
  });

  socket.on("join", (playerDTO: CreatePlayerDTO, roomName: string) => {
    const game = games.get(roomName);
    console.log(playerDTO, roomName);

    if (!game) {
      console.log("Game not found");
      socket.emit("gameError", {
        type: GameErrorTypes.GAME_NOT_FOUND,
        message: "Game not found",
      });

      return;
    }

    const player = new Player(playerDTO);
    socket.data.name = player.name;
    socket.data.room = roomName;
    socket.data.playerId = player.id;

    const err = game.addPlayer(player);

    if (err) {
      socket.emit("gameError", err);

      return;
    }

    console.log("Joining game");

    socket.join(roomName);
    socket.emit("gameJoined", game, player);
    socket.to(roomName).emit("newUserJoined", player);
  });

  socket.on("startGame", () => {
    const game = games.get(socket.data.room);

    if (game) {
      const err = game.startGame();

      if (err) {
        socket.emit("gameError", err);

        return;
      }

      io.to(socket.data.room).emit("gameStarted");
    }
  });

  socket.on("reveal", (card: Card) => {
    const room = socket.data.room;
    const game = games.get(room);

    if (game) {
      card = game.revealCard(card);

      if (game.checkForWin()) {
        game.revealAll();
        io.to(room).emit("gameOver", game);
      } else {
        io.to(room).emit("cardRevealed", card);
      }
    }
  });

  socket.on("assignSpymaster", (player: PlayerDTO) => {
    const game = games.get(socket.data.room);

    if (game) {
      const [err, spymaster] = game.assignSpyMaster(player);

      if (err) {
        socket.emit("gameError", err);
      } else {
        console.log("Emitting spymaster assigned: ", spymaster);
        io.to(socket.data.room).emit("spymasterAssigned", spymaster);
      }
    }
  });

  socket.on("reset", () => {
    const game = games.get(socket.data.room);

    if (game) {
      game.reset();
      io.to(socket.data.room).emit("newGame", game);
    }
  });

  socket.on("leaveGame", () => {
    const game = games.get(socket.data.room);

    if (game) {
      console.log("Removing player", socket.data.name);
      game.removePlayer(socket.data.playerId);
      socket.to(socket.data.room).emit("playerLeft", socket.data.playerId);

      if (game.isEmpty()) {
        console.log("Removing game", socket.data.room);
        games.delete(socket.data.room);
      }
    }
  });

  socket.on("disconnect", () => {
    const game = games.get(socket.data.room);

    if (game) {
      console.log("Removing player", socket.data.name);
      game.removePlayer(socket.data.playerId);
      socket.to(socket.data.room).emit("playerLeft", socket.data.playerId);

      if (game.isEmpty()) {
        console.log("Removing game", socket.data.room);
        games.delete(socket.data.room);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
