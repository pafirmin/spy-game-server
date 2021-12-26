import { Card } from "./card.interface";
import { Player } from "./socket-data.interface";

export interface RoomData {
  cards: Card[];
  players: Player[];
  score: { red: number; blue: number };
}
