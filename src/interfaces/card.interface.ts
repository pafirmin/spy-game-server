import { Teams } from "../enums/teams.enum";

export interface Card {
  word: string;
  team: Teams | null;
  isRevealed: boolean;
  isAssassin: boolean;
}
