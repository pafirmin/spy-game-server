import { CreatePlayerDTO } from "../dtos/create-player.dto";
import { PlayerDTO } from "../dtos/player.dto";
import { Card } from "./card.interface";

export interface ClientToServerEvents {
  findGame: (s: string) => void;
  create: (s: string) => void;
  switchTeam: (id: string) => void;
  join: (p: CreatePlayerDTO, n: string) => void;
  reveal: (c: Card) => void;
  reset: () => void;
  assignSpymaster: (d: PlayerDTO) => void;
  startGame: () => void;
  leaveGame: () => void;
}
