import { Card } from "../../interfaces/card.interface";
import Player from "../player/player.class";
import { sampleSize, shuffle } from "lodash";
import words from "../../words";
import { Teams } from "../../enums/teams.enum";
import { GameErrorTypes } from "../../enums/game-error-types.enum";
import { GameError } from "../../interfaces/game-error.interface";
import { PlayerDTO } from "../../dtos/player.dto";
import { GameDTO } from "../../dtos/game.dto";

export default class Game {
  public readonly name: string;
  private _startingTeam: Teams;
  private _activeTeam: Teams;
  private _scores: { [Teams.RED]: number; [Teams.BLUE]: number };
  private _players: Player[];
  private _cards: Card[];
  private _started: boolean;
  private _gameOver: boolean;

  constructor(name: string) {
    this.name = name;
    this._startingTeam =
      Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
    this._activeTeam = this._startingTeam;
    this._players = [];
    this._scores[Teams.BLUE] = 0;
    this._scores[Teams.RED] = 0;
    this._started = false;
    this._gameOver = false;
    this.initCards();
  }

  get startingTeam() {
    return this._startingTeam;
  }

  get activeTeam() {
    return this._activeTeam;
  }

  get scores() {
    return this._scores;
  }

  get players() {
    return this._players;
  }

  get cards() {
    return this._cards;
  }

  get started() {
    return this._started;
  }

  get gameOver() {
    return this._gameOver;
  }

  getPlayer(name: string) {
    return this._players.find((player) => player.name === name);
  }

  addPlayer(player: Player): GameError {
    const existingPlayer = this._players.find((p) => p.name === player.name);

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

    this._players.push(player);
  }

  isEmpty() {
    return this._players.length === 0;
  }

  removePlayer(id: string) {
    this._players = this._players.filter((p) => p.id !== id);
  }

  setActiveTeam(team: Teams) {
    this._activeTeam = team;
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

    if (this._activeTeam !== card.team) {
      this.endTurn();
    }

    if (this.checkForWin()) {
      this._scores[this._activeTeam]++;
      this._gameOver = true;
    }

    return { ...card, isRevealed: true };
  }

  countRemainingCards(team: Teams) {
    return this._cards.filter((card) => !card.isRevealed && card.team === team)
      .length;
  }

  assignSpyMaster(playerDto: PlayerDTO): [GameError, PlayerDTO] {
    const spymaster = this._players.find(
      (p) => p.isSpymaster && p.team === playerDto.team
    );

    if (spymaster) {
      const error: GameError = {
        type: GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
        message: `${spymaster.name} is already spymaster!`,
      };

      return [error, null];
    }

    const player = this._players.find((p) => p.id === playerDto.id);
    player.makeSpymaster();

    return [null, player];
  }

  reset() {
    this._startingTeam =
      this._startingTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;
    this._activeTeam = this._startingTeam;
    this._started = false;
    this._gameOver = false;
    this._players = this._players.map((player) =>
      player.isSpymaster ? player.relinquishSpymaster() : player
    );
    this.initCards();
  }

  revealAll() {
    this._cards = this._cards.map((card) => ({ ...card, isRevealed: true }));
  }

  private checkForWin(): boolean {
    const winByAssassin = this._cards.some(
      (card) => card.isAssassin && card.isRevealed
    );
    const winByReveal = !this._cards.some(
      (card) => !card.isRevealed && card.team === this._activeTeam
    );

    return winByAssassin || winByReveal;
  }

  private endTurn() {
    this._activeTeam = this._activeTeam === Teams.RED ? Teams.BLUE : Teams.RED;

    return this;
  }

  private autoAssignTeam(player: Player): Player {
    const numRed = this._players.filter(
      (player) => player.team === Teams.RED
    ).length;
    const numBlue = this._players.filter(
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

  private initCards() {
    this._cards = shuffle(
      sampleSize(words, 25).map((word, i) => ({
        word,
        team:
          i > 0 && i < 10
            ? this._activeTeam
            : i < 17
            ? this._activeTeam === Teams.BLUE
              ? Teams.RED
              : Teams.BLUE
            : null,
        isRevealed: false,
        isAssassin: i === 0,
      }))
    );
  }

  toJSON(): GameDTO {
    return {
      name: this.name,
      scores: this._scores,
      players: this._players,
      cards: this.cards,
      started: this.started,
      remainingRed: this.countRemainingCards(Teams.RED),
      remainingBlue: this.countRemainingCards(Teams.BLUE),
      gameOver: this._gameOver,
    };
  }
}
