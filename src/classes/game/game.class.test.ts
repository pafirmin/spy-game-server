import { CreatePlayerDTO } from "../../dtos/create-player.dto";
import { Teams } from "../../enums/teams.enum";
import Player from "../player/player.class";
import Room from "./game.class";

describe("Room", () => {
  let room: Room;

  beforeEach(() => {
    room = new Room("Test");
  });

  it("Creates the correct number of cards", () => {
    expect(room.cards.length).toBe(25);
  });

  it("Assigns one card as an assassin", () => {
    const assassin = room.cards.filter((card) => card.isAssassin);

    expect(assassin).toHaveLength(1);
  });

  it("Assigns correct number of cards to teams", () => {
    const startingTeamCards = room.cards.filter(
      (card) => card.team === room.activeTeam
    );
    const otherTeamCards = room.cards.filter(
      (card) => card.team && card.team !== room.activeTeam
    );

    expect(startingTeamCards).toHaveLength(9);
    expect(otherTeamCards).toHaveLength(8);
  });

  it("Reveal method sets card to revealed", () => {
    room.revealCard(room.cards[0]);

    expect(room.cards[0]).toHaveProperty("isRevealed", true);
  });

  it("Correctly counts remaining hidden cards", () => {
    const blueCards = room.cards.filter((card) => card.team === Teams.BLUE);
    const count = blueCards.length;

    room.revealCard(blueCards[0]);

    const remaining = room.countRemainingCards(Teams.BLUE);

    expect(remaining).toBe(count - 1);
  });

  it("Identifies a win when assassin is revealed", () => {
    const assassin = room.cards.find((card) => card.isAssassin);

    room.revealCard(assassin);

    expect(room.gameOver).toBe(true);
  });

  it("Identifies a win when all teams cards are revealed", () => {
    room.setActiveTeam(Teams.RED);
    const blueCards = room.cards.filter((card) => card.team === Teams.BLUE);
    blueCards.forEach((card) => room.revealCard(card));

    expect(room.gameOver).toBe(true);
  });

  it("Auto assigns player to smaller team if team not specified", () => {
    const mockPlayers: CreatePlayerDTO[] = [
      {
        name: "Test1",
        team: Teams.BLUE,
      },
      {
        name: "Test2",
        team: Teams.BLUE,
      },
      {
        name: "Test3",
        team: Teams.RED,
      },
      {
        name: "Test4",
        team: null,
      },
    ];

    for (const player of mockPlayers) {
      room.addPlayer(new Player(player));
    }

    expect(room.getPlayer("Test4")).toHaveProperty("team", Teams.RED);
  });
});
