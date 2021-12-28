import { GameDTO } from "../dtos/game.dto";
import { PlayerDTO } from "../dtos/player.dto";
import { Card } from "./card.interface";
import { GameError } from "./game-error.interface";

export interface ServerToClientEvents {
  newUserJoined: (d: PlayerDTO) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (card: Card) => void;
  gameOver: (game: GameDTO) => void;
  gameJoined: (game: GameDTO, p: PlayerDTO) => void;
  newGame: (game: GameDTO) => void;
  spymasterAssigned: (p: PlayerDTO) => void;
  gameCreated: (name: string) => void;
  gameStarted: () => void;
  playerLeft: (id: String) => void;
}
