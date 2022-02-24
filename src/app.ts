import express, { Request, Response } from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import { Server } from "socket.io";
import { ClientToServerEvents } from "./common/interfaces/client-to-server-events.interface";
import { ServerToClientEvents } from "./common/interfaces/server-to-client-event.interface";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { SocketData } from "./common/interfaces/socket-data.interface";
import GameService from "./services/game.service";
import SocketServer from "./socket/socket-server";

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

const gameService = new GameService();
const socketServer = new SocketServer(io, gameService)

socketServer.listen()

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

app.get("/games/:name", (req: Request, res: Response) => {
  try {
    const game = gameService.find(req.params.name);

    if (!game) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.status(200).json(game);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
