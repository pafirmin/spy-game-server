import { Card } from "../../interfaces/card.interface";
import { Player } from "../../interfaces/socket-data.interface";
import { sampleSize, shuffle } from "lodash";
import words from "../../words";
import { Teams } from "../../enums/teams.enum";
import { GameErrorTypes } from "../../enums/game-error-types.enum";
import { GameError } from "../../interfaces/game-error.interface";

export default class Game {
  public readonly name: string;
  public activeTeam: Teams;
  public startingTeam: Teams;
  public blueScore: number;
  public redScore: number;
  public players: Player[];
  private _cards: Card[];
  private _started: boolean;

  constructor(name: string) {
    this.name = name;
    this.players = [];
    this.blueScore = 0;
    this.redScore = 0;
    this.startingTeam =
      Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
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

  addPlayer(player: Player): [GameError, Player] {
    const existingPlayer = this.players.find((p) => p.name === player.name);

    if (existingPlayer) {
      const error: GameError = {
        type: GameErrorTypes.PLAYER_NAME_TAKEN,
        message: `Name ${player.name} is already taken!`,
      };

      return [error, null];
    }
    this.players.push(player);

    return [null, player];
  }

  isEmpty() {
    return this.players.length === 0;
  }

  removePlayer(name: string) {
    this.players = this.players.filter((p) => p.name !== name);
  }

  startGame(): GameError {
    if (this._started) {
      const error: GameError = {
        type: GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
        message: "The game has already started!",
      };

      return error;
    }
    this._started = true;
  }

  revealCard(card: Card) {
    this._cards = this._cards.map((c) =>
      c.word === card.word ? { ...c, isRevealed: true } : c
    );

    if (this.activeTeam !== card.team) {
      this.endTurn();
    }

    return { ...card, isRevealed: true };
  }

  countRemainingCards(team: Teams) {
    return this._cards.filter((card) => !card.isRevealed && card.team === team)
      .length;
  }

  endTurn() {
    this.activeTeam = this.activeTeam === Teams.RED ? Teams.BLUE : Teams.RED;

    return this;
  }

  assignSpyMaster(player: Player): [GameError, Player] {
    const spymaster = this.players.find(
      (p) => p.isSpymaster && p.team === player.team
    );

    if (spymaster) {
      const error: GameError = {
        type: GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
        message: `${spymaster.name} is already spymaster!`,
      };

      return [error, null];
    }

    this.players = this.players.map((p) =>
      p.name === player.name ? { ...p, isSpymaster: true } : p
    );

    return [null, { ...player, isSpymaster: true }];
  }

  checkForWin() {
    return Boolean(
      this._cards.find(
        (card) =>
          (card.isAssassin && card.isRevealed) ||
          (!card.isRevealed && card.team === this.activeTeam)
      )
    );
  }

  reset() {
    this.startingTeam =
      this.startingTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;
    this.activeTeam = this.startingTeam;
    this._started = false;
    this.players = this.players.map((player) =>
      player.isSpymaster ? { ...player, isSpymaster: false } : player
    );
    this.initCards();
  }

  revealAll() {
    this._cards = this._cards.map((card) => ({ ...card, isRevealed: true }));
  }

  private initCards() {
    this._cards = shuffle(
      sampleSize(words, 25).map((word, i) => ({
        word,
        team:
          i > 0 && i < 10
            ? this.activeTeam
            : i < 17
            ? this.activeTeam === Teams.BLUE
              ? Teams.RED
              : Teams.BLUE
            : null,
        isRevealed: false,
        isAssassin: i === 0,
      }))
    );
  }

  toJSON() {
    return {
      name: this.name,
      blueScore: this.blueScore,
      redScore: this.redScore,
      players: this.players,
      cards: this.cards,
      started: this.started,
      remainingRed: this.countRemainingCards(Teams.RED),
      remainingBlue: this.countRemainingCards(Teams.BLUE),
    };
  }
}
