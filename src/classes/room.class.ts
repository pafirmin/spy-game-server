import { Card } from "../interfaces/card.interface";
import { Player } from "../interfaces/socket-data.interface";
import { sampleSize, shuffle } from "lodash";
import words from "../words";
import { Teams } from "../enums/teams.enum";
import { GameErrorTypes } from "../enums/game-error-types.enum";
import { GameError } from "../interfaces/game-error.interface";

export default class Game {
  public readonly name: string;
  public activeTeam: Teams;
  public startingTeam: Teams;
  public blueScore: number;
  public redScore: number;
  public players: Player[];
  public cards: Card[];

  constructor(name: string) {
    this.name = name;
    this.blueScore = 0;
    this.redScore = 0;
    this.startingTeam =
      Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
    this.activeTeam = this.startingTeam;
    this.initCards();
  }

  addPlayer(player: Player) {
    this.players.push(player);

    return this;
  }

  revealCard(card: Card) {
    this.cards = this.cards.map((c) =>
      c.word === card.word ? { ...c, isRevealed: true } : c
    );

    if (this.activeTeam !== card.team) {
      this.endTurn();
    }

    return this;
  }

  countRemainingCards(team: Teams) {
    return this.cards.filter((card) => !card.isRevealed && card.team === team)
      .length;
  }

  endTurn() {
    this.activeTeam = this.activeTeam === Teams.RED ? Teams.BLUE : Teams.RED;

    return this;
  }

  assignSpyMaster(player: Player): GameError | undefined {
    const spymaster = this.players.find(
      (p) => p.isSpymaster && p.team === player.team
    );

    if (spymaster) {
      return {
        type: GameErrorTypes.SPYMASTER_ALREADY_ASSIGNED,
        message: `${spymaster.name} is already spymaster!`,
      };
    }

    this.players = this.players.map((p) =>
      p.name === player.name ? { ...p, isSpymaster: true } : p
    );
  }

  checkForWin() {
    return Boolean(
      this.cards.find(
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
    this.initCards();
  }

  revealAll() {
    this.cards = this.cards.map((card) => ({ ...card, isRevealed: true }));
  }

  private initCards() {
    this.cards = shuffle(
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
      remainingRed: this.countRemainingCards(Teams.RED),
      remainingBlue: this.countRemainingCards(Teams.BLUE),
    };
  }
}
