import { Socket } from "socket.io";
import { SocketData } from "./socket-data.interface";

export interface ClientToServerEvents {
  create: (d: SocketData, s: Socket) => void;
  join: (d: SocketData, s: Socket) => void;
}
