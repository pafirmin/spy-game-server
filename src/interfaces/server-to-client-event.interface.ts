import Room from "../classes/room.class";

export interface ServerToClientEvents {
  newUserJoined: (d: Room) => void;
  roomNotFound: () => void;
  roomNameTaken: () => void;
  cardRevealed: (d: Room) => void;
}
