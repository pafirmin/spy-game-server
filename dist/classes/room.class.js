"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const words_1 = __importDefault(require("../words"));
const teams_enum_1 = require("../enums/teams.enum");
const game_error_types_enum_1 = require("../enums/game-error-types.enum");
class Game {
    constructor(name) {
        this.name = name;
        this.players = [];
        this.blueScore = 0;
        this.redScore = 0;
        this.startingTeam =
            Math.floor(Math.random() * 2) + 1 === 1 ? teams_enum_1.Teams.RED : teams_enum_1.Teams.BLUE;
        this.activeTeam = this.startingTeam;
        this._started = false;
        this.initCards();
    }
    get started() {
        return this._started;
    }
    get cards() {
        return this._cards;
    }
    addPlayer(player) {
        const existingPlayer = this.players.find((p) => p.name === player.name);
        if (existingPlayer) {
            const error = {
                type: game_error_types_enum_1.GameErrorTypes.PLAYER_NAME_TAKEN,
                message: `Name ${player.name} is already taken!`,
            };
            return [error, null];
        }
        this.players.push(player);
        return [null, player];
    }
    removePlayer(player) {
        this.players = this.players.filter((p) => p.name === player.name);
    }
    startGame() {
        if (this._started) {
            const error = {
                type: game_error_types_enum_1.GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
                message: "The game has already started!",
            };
            return error;
        }
        this._started = true;
    }
    revealCard(card) {
        this._cards = this._cards.map((c) => c.word === card.word ? Object.assign(Object.assign({}, c), { isRevealed: true }) : c);
        if (this.activeTeam !== card.team) {
            this.endTurn();
        }
        return Object.assign(Object.assign({}, card), { isRevealed: true });
    }
    countRemainingCards(team) {
        return this._cards.filter((card) => !card.isRevealed && card.team === team)
            .length;
    }
    endTurn() {
        this.activeTeam = this.activeTeam === teams_enum_1.Teams.RED ? teams_enum_1.Teams.BLUE : teams_enum_1.Teams.RED;
        return this;
    }
    assignSpyMaster(player) {
        const spymaster = this.players.find((p) => p.isSpymaster && p.team === player.team);
        if (spymaster) {
            const error = {
                type: game_error_types_enum_1.GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
                message: `${spymaster.name} is already spymaster!`,
            };
            return [error, null];
        }
        this.players = this.players.map((p) => p.name === player.name ? Object.assign(Object.assign({}, p), { isSpymaster: true }) : p);
        return [null, Object.assign(Object.assign({}, player), { isSpymaster: true })];
    }
    checkForWin() {
        return Boolean(this._cards.find((card) => (card.isAssassin && card.isRevealed) ||
            (!card.isRevealed && card.team === this.activeTeam)));
    }
    reset() {
        this.startingTeam =
            this.startingTeam === teams_enum_1.Teams.BLUE ? teams_enum_1.Teams.RED : teams_enum_1.Teams.BLUE;
        this.activeTeam = this.startingTeam;
        this._started = false;
        this.players = this.players.map((player) => player.isSpymaster ? Object.assign(Object.assign({}, player), { isSpymaster: false }) : player);
        this.initCards();
    }
    revealAll() {
        this._cards = this._cards.map((card) => (Object.assign(Object.assign({}, card), { isRevealed: true })));
    }
    initCards() {
        this._cards = (0, lodash_1.shuffle)((0, lodash_1.sampleSize)(words_1.default, 25).map((word, i) => ({
            word,
            team: i > 0 && i < 10
                ? this.activeTeam
                : i < 17
                    ? this.activeTeam === teams_enum_1.Teams.BLUE
                        ? teams_enum_1.Teams.RED
                        : teams_enum_1.Teams.BLUE
                    : null,
            isRevealed: false,
            isAssassin: i === 0,
        })));
    }
    toJSON() {
        return {
            name: this.name,
            blueScore: this.blueScore,
            redScore: this.redScore,
            players: this.players,
            cards: this.cards,
            started: this.started,
            remainingRed: this.countRemainingCards(teams_enum_1.Teams.RED),
            remainingBlue: this.countRemainingCards(teams_enum_1.Teams.BLUE),
        };
    }
}
exports.default = Game;
//# sourceMappingURL=room.class.js.map