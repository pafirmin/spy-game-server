import Game from "../classes/game/game.class";
import { PlayerDTO } from "../dtos/player.dto";
import { Card } from "./card.interface";
import { GameError } from "./game-error.interface";

export interface ServerToClientEvents {
  newUserJoined: (d: PlayerDTO) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (card: Card) => void;
  gameOver: (d: Game) => void;
  gameJoined: (d: Game, p: PlayerDTO) => void;
  newGame: (d: Game) => void;
  spymasterAssigned: (p: PlayerDTO) => void;
  gameCreated: (d: string) => void;
  gameStarted: () => void;
  playerLeft: (n: String) => void;
}
