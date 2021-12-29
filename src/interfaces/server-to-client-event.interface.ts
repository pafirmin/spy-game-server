import { GameDTO } from "../dtos/game.dto";
import { PlayerDTO } from "../dtos/player.dto";
import { Card } from "./card.interface";
import { GameError } from "./game-error.interface";

export interface ServerToClientEvents {
  gameFound: (name: string) => void;
  newUserJoined: (player: PlayerDTO) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (card: Card) => void;
  updateGame: (game: GameDTO) => void;
  gameOver: (game: GameDTO) => void;
  gameJoined: (game: GameDTO, player: PlayerDTO) => void;
  newGame: (game: GameDTO) => void;
  spymasterAssigned: (player: PlayerDTO) => void;
  gameStarted: () => void;
  playerLeft: (id: String) => void;
  teamSwitched: (player: PlayerDTO) => void;
}
