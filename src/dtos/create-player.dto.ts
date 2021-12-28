import { Teams } from "../enums/teams.enum";

export interface CreatePlayerDTO {
  name: string;
  team: Teams | null;
}
