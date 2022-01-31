import Game from "../common/classes/game.class";
import Player from "../common/classes/player.class";
import { Teams } from "../common/enums/teams.enum";
import { UpdateParams } from "../common/types";
import GameService from "./game.service";

jest.mock("uuid", () => ({ v4: () => "123" }));

describe("Game Service", () => {
  let gameService: GameService;

  beforeEach(() => {
    gameService = new GameService();
    gameService.create("Test");
  });

  it("Retrieves a game by name", () => {
    const game = gameService.find("Test");

    expect(game).toBeDefined();
  });

  it("Initialises a game with correct number of cards", () => {
    const game = gameService.find("Test");

    expect(game.cards).toHaveLength(25);
  });

  it("Assigns correct number of cards to teams", () => {
    const game = gameService.find("Test");
    const startingTeamCards = game.cards.filter(
      (c) => c.team === game.startingTeam
    );
    const otherTeamCards = game.cards.filter(
      (c) => c.team && c.team !== game.startingTeam
    );

    expect(startingTeamCards).toHaveLength(9);
    expect(otherTeamCards).toHaveLength(8);
  });

  it("Assigns a single neutral assassin card", () => {
    const game = gameService.find("Test");
    const assassins = game.cards.filter((c) => c.isAssassin);

    expect(assassins).toHaveLength(1);
    expect(assassins[0].team).toBeNull();
  });

  it("update method returns updated game", () => {
    let game = gameService.find("Test");
    const updateParams: UpdateParams<Game> = { name: "Changed" };

    game = gameService.update("Test", updateParams);
    expect(game.name).toBe("Changed");
  });

  it("Deletes a game by name", () => {
    gameService.remove("Test");
    const game = gameService.find("Test");

    expect(game).toBeUndefined();
  });

  it("Adds a player to the game", () => {
    const player = new Player({ name: "Test", team: Teams.BLUE });
    gameService.addPlayer("Test", player);

    const game = gameService.find("Test");
    expect(game.players).toContainEqual(player);
  });

  it("Keeps teams balanced when team not specified", () => {
    for (let i = 0; i < 100; i++) {
      const player = new Player({ name: `Test${i}` });
      gameService.addPlayer("Test", player);
    }

    const game = gameService.find("Test");
    const redTeam = game.players.filter((p) => p.team === Teams.RED);
    const blueTeam = game.players.filter((p) => p.team === Teams.BLUE);

    expect(blueTeam.length).toEqual(redTeam.length);
  });

  it("Detects a win when all cards revealed", () => {
    const game = gameService.find("Test");

    for (const card of game.cards) {
      gameService.revealCard("Test", card);
    }

    expect(game.gameOver).toBe(true);
  });
});
