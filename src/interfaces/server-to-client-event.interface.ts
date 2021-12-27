import Game from "../classes/game/game.class";
import { Card } from "./card.interface";
import { GameError } from "./game-error.interface";
import { Player } from "./socket-data.interface";

export interface ServerToClientEvents {
  newUserJoined: (d: Player) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (card: Card) => void;
  gameOver: (d: Game) => void;
  gameJoined: (d: Game) => void;
  newGame: (d: Game) => void;
  spymasterAssigned: (p: Player) => void;
  gameCreated: (d: string) => void;
  gameStarted: () => void;
  playerLeft: (d: Player) => void;
}
