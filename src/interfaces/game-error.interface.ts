import { GameErrorTypes } from "../enums/game-error-types.enum";

export interface GameError {
  type: GameErrorTypes;
  message: string;
}
