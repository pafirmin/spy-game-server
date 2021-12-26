import { Card } from "../interfaces/card.interface";
import { Player } from "../interfaces/socket-data.interface";
import { sampleSize, shuffle } from "lodash";
import words from "../words";
import { Teams } from "../enums/teams.enum";

export default class Room {
  public readonly name: string;
  public blueScore: number;
  public redScore: number;
  public players: Player[];
  public cards: Card[];

  constructor(name: string) {
    this.name = name;
    this.blueScore = 0;
    this.redScore = 0;
    this.initCards();
  }

  addPlayer(player: Player) {
    this.players.push(player);

    return this;
  }

  initCards() {
    this.cards = shuffle(
      sampleSize(words, 25).map((word, i) => ({
        word,
        team: i > 0 && i < 9 ? Teams.RED : i > 8 && i < 18 ? Teams.BLUE : null,
        isRevealed: false,
        isAssassin: i === 0,
      }))
    );
  }

  revealCard(card: Card) {
    this.cards = this.cards.map((c) =>
      c.word === card.word ? { ...c, isRevealed: true } : c
    );

    return this;
  }

  toJSON() {
    return {
      name: this.name,
      blueScore: this.blueScore,
      redScore: this.redScore,
      players: this.players,
      cards: this.cards,
    };
  }
}
