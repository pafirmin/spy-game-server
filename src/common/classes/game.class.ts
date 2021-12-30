import { Teams } from "../enums/teams.enum";
import { Card } from "../interfaces/card.interface";
import Player from "./player.class";

export default class Game {
  public readonly name: string;
  public readonly startingTeam: Teams;
  public readonly activeTeam: Teams;
  public readonly scores: { [Teams.RED]: number; [Teams.BLUE]: number };
  public readonly players: Player[];
  public readonly cards: Card[];
  public readonly started: boolean;
  public readonly gameOver: boolean;

  constructor(name: string) {
    this.name = name;
    this.startingTeam =
      Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
    this.activeTeam = this.startingTeam;
    this.players = [];
    this.scores = { [Teams.BLUE]: 0, [Teams.RED]: 0 };
    this.started = false;
    this.gameOver = false;
  }
}
