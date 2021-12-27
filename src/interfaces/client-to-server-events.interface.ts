import { Socket } from "socket.io";
import { Card } from "./card.interface";
import { Player } from "./socket-data.interface";

export interface ClientToServerEvents {
  create: (s: string) => void;
  join: (d: Player, s: Socket) => void;
  reveal: (d: { card: Card; player: Player }) => void;
  reset: (d: Player, s: Socket) => void;
  assignSpyMaster: (d: Player, s: Socket) => void;
  startGame: (d: Player, s: Socket) => void;
  leaveGame: (d: Player) => void;
}
