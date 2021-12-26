import { RoomData } from "./room-data.interface";
import { SocketData } from "./socket-data.interface";

export interface ServerToClientEvents {
  newUserJoined: (d: RoomData) => void;
  roomNotFound: () => void;
  roomNameTaken: () => void;
}
