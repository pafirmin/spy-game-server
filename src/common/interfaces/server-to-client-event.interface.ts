import Game from "../classes/game/game.class";
import Player from "../classes/player/player.class";
import { PlayerDTO } from "../dtos/player.dto";
import { Card } from "./card.interface";
import { GameError } from "./game-error.interface";

export interface ServerToClientEvents {
  gameFound: (name: string) => void;
  newUserJoined: (player: PlayerDTO) => void;
  gameError: (err: GameError) => void;
  cardRevealed: (card: Card) => void;
  updateGame: (game: Game) => void;
  gameOver: (game: Game) => void;
  gameJoined: (game: Game, player: Player) => void;
  newGame: (game: Game) => void;
  spymasterAssigned: (player: Player) => void;
  gameStarted: () => void;
  playerLeft: (player: Player) => void;
  teamSwitched: (player: Player) => void;
  turnEnded: () => void;
}
