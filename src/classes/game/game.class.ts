import { Card } from "../../interfaces/card.interface";
import Player from "../player/player.class";
import { sampleSize, shuffle } from "lodash";
import words from "../../words";
import { Teams } from "../../enums/teams.enum";
import { GameErrorTypes } from "../../enums/game-error-types.enum";
import { GameError } from "../../interfaces/game-error.interface";
import { PlayerDTO } from "../../dtos/player.dto";

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

  getPlayer(name: string) {
    return this.players.find((player) => player.name === name);
  }

  addPlayer(player: Player): GameError {
    const existingPlayer = this.players.find((p) => p.name === player.name);

    if (existingPlayer) {
      const error: GameError = {
        type: GameErrorTypes.PLAYER_NAME_TAKEN,
        message: `Name ${player.name} is already taken!`,
      };

      return error;
    }

    if (!player.team) {
      player = this.autoAssignTeam(player);
    }

    this.players.push(player);
  }

  private autoAssignTeam(player: Player): Player {
    const numRed = this.players.filter(
      (player) => player.team === Teams.RED
    ).length;
    const numBlue = this.players.filter(
      (player) => player.team === Teams.BLUE
    ).length;

    let team: Teams;

    if (numBlue === numRed) {
      team = Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
    } else {
      team = numRed > numBlue ? Teams.BLUE : Teams.RED;
    }

    return player.setTeam(team);
  }

  isEmpty() {
    return this.players.length === 0;
  }

  removePlayer(id: string) {
    this.players = this.players.filter((p) => p.id !== id);
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

  private endTurn() {
    this.activeTeam = this.activeTeam === Teams.RED ? Teams.BLUE : Teams.RED;

    return this;
  }

  assignSpyMaster(playerDto: PlayerDTO): [GameError, PlayerDTO] {
    const spymaster = this.players.find(
      (p) => p.isSpymaster && p.team === playerDto.team
    );

    if (spymaster) {
      const error: GameError = {
        type: GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
        message: `${spymaster.name} is already spymaster!`,
      };

      return [error, null];
    }

    const player = this.players.find((p) => p.id === playerDto.id);
    player.makeSpymaster();

    return [null, player];
  }

  checkForWin(): boolean {
    const winByAssassin = this._cards.some(
      (card) => card.isAssassin && card.isRevealed
    );
    const winByReveal = !this._cards.some(
      (card) => !card.isRevealed && card.team === this.activeTeam
    );

    return winByAssassin || winByReveal;
  }

  reset() {
    this.startingTeam =
      this.startingTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;
    this.activeTeam = this.startingTeam;
    this._started = false;
    this.players = this.players.map((player) =>
      player.isSpymaster ? player.relinquishSpymaster() : player
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
