import { Teams } from "../enums/teams.enum";
import Room from "./room.class";

describe("Room", () => {
  const room = new Room("Test");

  it("Creates the correct number of cards", () => {
    expect(room.cards.length).toBe(25);
  });

  it("Assigns one card as an assassin", () => {
    const assassin = room.cards.filter((card) => card.isAssassin);

    expect(assassin).toHaveLength(1);
  });

  it("Assigns correct number of cards to teams", () => {
    const redCards = room.cards.filter((card) => card.team === Teams.RED);
    const blueCards = room.cards.filter((card) => card.team === Teams.BLUE);

    expect(redCards).toHaveLength(8);
    expect(blueCards).toHaveLength(9);
  });

  it("Sets card to revealed", () => {
    room.revealCard(room.cards[0]);

    expect(room.cards[0]).toHaveProperty("isRevealed", true);
    console.log(room.cards);
  });
});
