import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./common/interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./common/interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { SocketData } from "./common/interfaces/socket-data.interface";
import { Card } from "./common/interfaces/card.interface";
import Player from "./common/classes/player.class";
import { CreatePlayerDTO } from "./common/dtos/create-player.dto";
import GameService from "./services/game.service";
import { Teams } from "./common/enums/teams.enum";

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

const gameService: GameService = new GameService();

io.on("connection", (socket) => {
  socket.on("create", (roomName) => {
    try {
      const game = gameService.create(roomName);

      socket.emit("gameFound", game.name);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("findGame", (name) => {
    try {
      const game = gameService.find(name);

      socket.emit("gameFound", game.name);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("join", (playerDTO: CreatePlayerDTO, roomName: string) => {
    try {
      const game = gameService.findOrFail(roomName);

      let player = new Player(playerDTO);

      socket.data.name = player.name;
      socket.data.room = roomName;
      socket.data.playerId = player.id;

      player = gameService.addPlayer(game.name, player);

      socket.join(roomName);
      socket.emit("gameJoined", game, player);
      socket.to(roomName).emit("newUserJoined", player);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("startGame", () => {
    try {
      const game = gameService.findOrFail(socket.data.room);

      if (game.players.length < 4) {
        throw new Error("Not enough players!");
      }

      const spymasters = gameService.getSpymasters(game);

      if (!spymasters.red || !spymasters.blue) {
        throw new Error("Both teams need a spymaster!");
      }

      gameService.update(socket.data.room, { started: true });

      io.to(socket.data.room).emit("gameStarted");
    } catch (err) {
      console.log(err);
      socket.emit("gameError", err.message);
    }
  });

  socket.on("reveal", (card: Card) => {
    try {
      const game = gameService.revealCard(socket.data.room, card);

      io.to(socket.data.room).emit("updateGame", game);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("assignSpymaster", () => {
    try {
      const game = gameService.findOrFail(socket.data.room);
      const player = game.players.find((p) => p.id === socket.data.playerId);
      let spymaster = game.players.find(
        (p) => p.isSpymaster && p.team === player.team
      );

      if (spymaster) {
        throw new Error(`${spymaster.name} is already spymaster!`);
      }

      spymaster = { ...player, isSpymaster: true };

      gameService.update(socket.data.room, {
        players: game.players.map((p) => (p.id === player.id ? spymaster : p)),
      });

      io.to(socket.data.room).emit("spymasterAssigned", spymaster);
    } catch (err) {
      console.log(err);
      socket.emit("gameError", err.message);
    }
  });

  socket.on("switchTeam", () => {
    try {
      let game = gameService.findOrFail(socket.data.room);
      let player = game.players.find((p) => p.id === socket.data.playerId);

      if (player.isSpymaster) {
        throw new Error("Spymasters cannot switch teams!");
      }

      player = {
        ...player,
        team: player.team === Teams.BLUE ? Teams.RED : Teams.BLUE,
      };

      gameService.update(socket.data.room, {
        players: game.players.map((p) => (p.id === player.id ? player : p)),
      });

      io.to(socket.data.room).emit("teamSwitched", player);
    } catch (err) {
      socket.emit("gameError", err.messag);
    }
  });

  socket.on("endTurn", () => {
    try {
      const game = gameService.findOrFail(socket.data.room);

      gameService.update(socket.data.room, {
        activeTeam: game.activeTeam === Teams.BLUE ? Teams.RED : Teams.BLUE,
      });

      io.to(socket.data.room).emit("turnEnded");
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("reset", () => {
    try {
      const game = gameService.resetGame(socket.data.room);

      io.to(socket.data.room).emit("newGame", game);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("leaveGame", () => {
    try {
      let game = gameService.findOrFail(socket.data.room);
      let player = game.players.find((p) => p.id === socket.data.playerId);

      game = gameService.update(socket.data.room, {
        players: game.players.filter((p) => p.id !== socket.data.playerId),
      });

      socket.to(socket.data.room).emit("playerLeft", player);

      if (game.players.length === 0) {
        gameService.remove(game.name);
      }
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("disconnect", () => {
    let game = gameService.find(socket.data.room);

    if (!game) return;

    let player = game.players.find((p) => p.id === socket.data.playerId);

    game = gameService.update(socket.data.room, {
      players: game.players.filter((p) => p.id !== socket.data.playerId),
    });

    socket.to(socket.data.room).emit("playerLeft", player);

    if (game.players.length === 0) {
      gameService.remove(game.name);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
