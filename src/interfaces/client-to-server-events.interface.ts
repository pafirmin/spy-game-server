import { Socket } from "socket.io";
import { Card } from "./card.interface";
import { SocketData } from "./socket-data.interface";

export interface ClientToServerEvents {
  create: (d: SocketData, s: Socket) => void;
  join: (d: SocketData, s: Socket) => void;
  reveal: (d: { card: Card; player: SocketData }) => void;
}
