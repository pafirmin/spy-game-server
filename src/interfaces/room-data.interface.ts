import { Card } from "./card.interface";
import { SocketData } from "./socket-data.interface";

export interface RoomData {
  cards: Card[];
  players: SocketData[];
  score: { red: number; blue: number };
}
