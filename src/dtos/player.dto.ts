import { Teams } from "../enums/teams.enum";

export interface PlayerDTO {
  id: string;
  name: string;
  team: Teams;
  isSpymaster: boolean;
}
