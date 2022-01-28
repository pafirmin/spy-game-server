import { Teams } from "../enums/teams.enum";
import { Card } from "../interfaces/card.interface";
import Player from "./player.class";

export default class Game {
  name: string;
  startingTeam: Teams;
  activeTeam: Teams;
  scores: { [Teams.RED]: number; [Teams.BLUE]: number };
  players: Player[];
  cards: Card[];
  started: boolean;
  gameOver: boolean;

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
