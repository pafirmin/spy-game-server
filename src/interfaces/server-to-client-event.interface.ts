import Room from "../classes/room.class";
import { GameError } from "./game-error.interface";

export interface ServerToClientEvents {
  newUserJoined: (d: Room) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (d: Room) => void;
  gameOver: (d: Room) => void;
  newGame: (d: Room) => void;
  spymasterAssigned: (d: Room) => void;
}
