"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_io_1 = require("socket.io");
const room_class_1 = __importDefault(require("./classes/room.class"));
const game_error_types_enum_1 = require("./enums/game-error-types.enum");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const PORT = process.env.PORT;
const games = new Map();
io.on("connection", (socket) => {
    socket.on("create", (data, socket) => {
        if (games.has(data.room)) {
            socket.emit("gameError", {
                type: game_error_types_enum_1.GameErrorTypes.GAME_NAME_TAKEN,
                message: `Name ${data.room} is already in use!`,
            });
            return;
        }
        const newGame = new room_class_1.default(data.room);
        newGame.addPlayer(data);
        games.set(data.room, newGame);
        socket.join(data.room);
        socket.emit("gameCreated", newGame);
    });
    socket.on("join", (data, socket) => {
        const game = games.get(data.room);
        if (game) {
            const [err, player] = game.addPlayer(data);
            if (err) {
                socket.emit("gameError", err);
                return;
            }
            socket.join(data.room);
            socket.emit("gameJoined", game);
            io.to(data.room).emit("newUserJoined", player);
        }
        else {
            socket.emit("gameError", {
                type: game_error_types_enum_1.GameErrorTypes.GAME_NOT_FOUND,
                message: "Game not found",
            });
        }
    });
    socket.on("startGame", (data) => {
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
    socket.on("reveal", (data) => {
        const game = games.get(data.player.room);
        if (game) {
            const card = game.revealCard(data.card);
            if (game.checkForWin()) {
                game.revealAll();
                io.to(data.player.room).emit("gameOver", game);
            }
            else {
                io.to(data.player.room).emit("cardRevealed", card);
            }
        }
    });
    socket.on("assignSpyMaster", (data) => {
        const game = games.get(data.room);
        if (game) {
            const [err, spymaster] = game.assignSpyMaster(data);
            if (err) {
                socket.emit("gameError", err);
            }
            else {
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
});
server.listen(3000, () => {
    console.log(`Server listening on port ${PORT}`);
});
//# sourceMappingURL=app.js.map