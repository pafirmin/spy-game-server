import Player from "../classes/player.class";
import { Card } from "./card.interface";

export interface ClientToServerEvents {
  findGame: (s: string) => void;
  create: (s: string) => void;
  switchTeam: (id: string) => void;
  join: (player: Player, n: string) => void;
  reveal: (c: Card) => void;
  reset: () => void;
  assignSpymaster: (d: Player) => void;
  startGame: () => void;
  leaveGame: () => void;
  endTurn: () => void;
  rejoin: (n: string, id: string) => void;
}
