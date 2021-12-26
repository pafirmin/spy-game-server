import { Teams } from "../enums/teams.enum";

export interface Player {
  name: string;
  room: string;
  team: Teams;
  isSpymaster: boolean;
}
