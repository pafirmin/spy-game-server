import { Teams } from "../enums/teams.enum";

export interface SocketData {
  playerId: string;
  name: string;
  room: string;
  team: Teams;
  isSpymaster: boolean;
}
