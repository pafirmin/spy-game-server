import { Teams } from "../enums/teams.enum";

export interface CreatePlayerDTO {
  name: string;
  id?: string;
  team?: Teams | null;
}
