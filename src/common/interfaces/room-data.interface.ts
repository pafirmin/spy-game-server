import { Card } from "./card.interface";
import Player from "../classes/player.class";

export interface RoomData {
  cards: Card[];
  players: Player[];
  score: { red: number; blue: number };
}
