import { Server } from "socket.io";
import Player from "../common/classes/player.class";
import { Card } from "../common/interfaces/card.interface";
import GameService from "../services/game.service";

export default class SocketServer {
  constructor(
    private readonly server: Server,
    private readonly gameService: GameService
  ) {
    this.gameService = gameService;
    this.server = server;
  }

  listen() {
    this.server.on("connection", (socket) => {
      socket.on("join", (player: Player, roomName: string) => {
        try {
          const [game, joined] = this.gameService.join(roomName, player);

          socket.data.room = roomName;
          socket.data.playerId = joined.id;
          socket.join(roomName);
          socket.emit("gameJoined", game, joined);
          socket.to(roomName).emit("newUserJoined", joined);
        } catch (err) {
          console.log(err);
          socket.emit("gameError", err.message);
        }
      });

      socket.on("startGame", () => {
        try {
          this.gameService.startGame(socket.data.room);

          this.server.to(socket.data.room).emit("gameStarted");
        } catch (err) {
          console.log(err);
          socket.emit("gameError", err.message);
        }
      });

      socket.on("reveal", (card: Card) => {
        try {
          const game = this.gameService.revealCard(socket.data.room, card);

          this.server.to(socket.data.room).emit("updateGame", game);
        } catch (err) {
          console.log(err);
          socket.emit("gameError", err.message);
        }
      });

      socket.on("assignSpymaster", () => {
        try {
          const player = this.gameService.assignSpymaster(
            socket.data.room,
            socket.data.playerId
          );

          this.server.to(socket.data.room).emit("spymasterAssigned", player);
        } catch (err) {
          console.log(err);
          socket.emit("gameError", err.message);
        }
      });

      socket.on("switchTeam", () => {
        try {
          const player = this.gameService.switchTeam(
            socket.data.room,
            socket.data.playerId
          );

          this.server.to(socket.data.room).emit("teamSwitched", player);
        } catch (err) {
          socket.emit("gameError", err.messag);
        }
      });

      socket.on("endTurn", () => {
        try {
          this.gameService.endTurn(socket.data.room);

          this.server.to(socket.data.room).emit("turnEnded");
        } catch (err) {
          socket.emit("gameError", err.message);
        }
      });

      socket.on("reset", () => {
        try {
          const game = this.gameService.resetGame(socket.data.room);

          this.server.to(socket.data.room).emit("newGame", game);
        } catch (err) {
          socket.emit("gameError", err.message);
        }
      });

      socket.on("leaveGame", () => {
        try {
          const player = this.gameService.removePlayer(
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
          const { room, playerId } = socket.data;
          const game = this.gameService.disconnectPlayer(room, playerId);
          const player = this.gameService.findPlayer(game, playerId);

          socket.to(socket.data.room).emit("playerDisconnected", player);

          setTimeout(() => {
            const game = this.gameService.find(room);

            if (!game) return;

            const player = this.gameService.findPlayer(game, playerId);

            if (player && player.disconnected) {
              this.gameService.removePlayer(game.name, playerId);
              socket.to(socket.data.room).emit("playerLeft", player);
            }
          }, 30000);
        } catch (err) {
          console.log(err);
        }
      });
    });
  }
}
