import { Teams } from "../enums/teams.enum";
import { Card } from "../interfaces/card.interface";
import { PlayerDTO } from "./player.dto";

export interface GameDTO {
  name: string;
  scores: { [Teams.RED]: number; [Teams.BLUE]: number };
  players: PlayerDTO[];
  cards: Card[];
  started: boolean;
  activeTeam: Teams;
  remainingRed: number;
  remainingBlue: number;
  gameOver: boolean;
}
