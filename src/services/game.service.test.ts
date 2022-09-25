import Player from "../common/classes/player.class";
import { Teams } from "../common/enums/teams.enum";
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

  it("Deletes a game by name", () => {
    gameService.remove("Test");
    const game = gameService.find("Test");

    expect(game).toBeUndefined();
  });

  it("Initialises a player on join", () => {
    const playerDto = { name: "Test", team: Teams.BLUE };
    const [game, player] = gameService.join("Test", new Player(playerDto));

    expect(game.players).toContainEqual(player);
  });

  it("Keeps teams balanced when team not specified", () => {
    for (let i = 0; i < 100; i++) {
      const player = new Player({ name: `Test${i}`, id: i.toString() });
      gameService.join("Test", player);
    }

    const game = gameService.find("Test");
    const redTeam = game.players.filter((p) => p.team === Teams.RED);
    const blueTeam = game.players.filter((p) => p.team === Teams.BLUE);

    expect(blueTeam.length).toEqual(redTeam.length);
  });

  it("Detects a win when all cards of one team revealed", () => {
    let game = gameService.find("Test");
    const cards = game.cards.filter((c) => c.team === Teams.BLUE);

    for (const card of cards) {
      game = gameService.revealCard("Test", card);
    }

    expect(game.gameOver).toBe(true);
  });

  it("disconnectPlayer sets a players to 'disconnected'", () => {
    let [game, player] = gameService.join("Test", new Player({name: "Test"}))

    game = gameService.disconnectPlayer("Test", player.id)
    player = gameService.findPlayer(game, player.id)

    expect(player.disconnected).toBe(true)
  })
});
