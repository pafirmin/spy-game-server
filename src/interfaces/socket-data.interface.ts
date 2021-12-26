import { Teams } from "../enums/teams.enum";

export interface SocketData {
  name: string;
  room: string;
  team: Teams;
  isSpymaster: boolean;
}
