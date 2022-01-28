import express, { Request, Response } from "express";
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
import GameService from "./services/game.service";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  DefaultEventsMap,
  SocketData
>(server, {
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT;

const gameService: GameService = new GameService();

io.on("connection", (socket) => {
  socket.on("join", (player: Player, roomName: string) => {
    try {
      let game = gameService.findOrFail(roomName);
      const joined = player.id && game.players.find((p) => p.id === player.id);

      if (!joined) {
        player = gameService.addPlayer(game.name, player);
        game = gameService.find(game.name);
      } else {
        player = {
          ...joined,
          name: player.name || joined.name,
          disconnected: false,
        };
        game = gameService.update(game.name, {
          players: game.players.map((p) => (p.id === player.id ? player : p)),
        });
      }

      socket.data.name = player.name;
      socket.data.room = roomName;
      socket.data.playerId = player.id;
      socket.join(roomName);
      socket.emit("gameJoined", game, player);
      socket.to(roomName).emit("newUserJoined", player);
    } catch (err) {
      console.log(err);
      socket.emit("gameError", err.message);
    }
  });

  socket.on("rejoin", () => {
    try {
      let game = gameService.findOrFail(socket.data.room);
      const players = game.players.map((p) =>
        p.id === socket.data.playerId ? { ...player, disconnected: false } : p
      );

      game = gameService.update(socket.data.room, { players });
      const player = game.players.find((p) => p.id === socket.data.playerId);

      socket.emit("gameJoined", game, player);
      socket.to(socket.data.room).emit("newUserJoined", player);
    } catch (err) {
      console.log(err);
      socket.emit("gameError", err.message);
    }
  });

  socket.on("startGame", () => {
    try {
      gameService.startGame(socket.data.room);

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
      const player = gameService.assignSpymaster(
        socket.data.room,
        socket.data.playerId
      );

      io.to(socket.data.room).emit("spymasterAssigned", player);
    } catch (err) {
      console.log(err);
      socket.emit("gameError", err.message);
    }
  });

  socket.on("switchTeam", () => {
    try {
      const player = gameService.switchTeam(
        socket.data.room,
        socket.data.playerId
      );

      io.to(socket.data.room).emit("teamSwitched", player);
    } catch (err) {
      socket.emit("gameError", err.messag);
    }
  });

  socket.on("endTurn", () => {
    try {
      gameService.endTurn(socket.data.room);

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
      const player = gameService.removePlayer(
        socket.data.room,
        socket.data.playerId
      );

      socket.to(socket.data.room).emit("playerLeft", player);
    } catch (err) {
      socket.emit("gameError", err.message);
    }
  });

  socket.on("disconnect", () => {
    try {
      let game = gameService.find(socket.data.room);

      if (!game) return;

      let player = game.players.find((p) => p.id === socket.data.playerId);

      game = gameService.update(socket.data.room, {
        players: game.players.map((p) =>
          p.id === socket.data.playerId ? { ...p, disconnected: true } : p
        ),
      });

      socket.to(socket.data.room).emit("playerDisconnected", player);

      setTimeout(() => {
        game = gameService.find(socket.data.room);

        if (!game) return;

        const player = game.players.find((p) => p.id === socket.data.playerId);

        if (player.disconnected) {
          gameService.removePlayer(game.name, socket.data.playerId);
          socket.to(socket.data.room).emit("playerLeft", player);
        }
      }, 30000);

      if (
        game.players.length === 0 ||
        game.players.every((p) => p.disconnected)
      ) {
        console.log("removing game");
        gameService.remove(game.name);
      }
    } catch (err) {
      console.log(err);
    }
  });
});

app.post("/games", (req: Request, res: Response) => {
  try {
    let game = gameService.find(req.body.name);

    if (game) {
      return res.status(400).json({ message: "Game name is taken" });
    }

    game = gameService.create(req.body.name);

    return res.status(201).json(game);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/games/:id", (req: Request, res: Response) => {
  try {
    const game = gameService.find(req.params.id);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.status(200).json(game);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.post("/players", (req: Request, res: Response) => {
  const player = new Player(req.body);

  return res.status(201).json(player);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
