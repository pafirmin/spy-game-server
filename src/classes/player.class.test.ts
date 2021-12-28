import Player from "./player/player.class";
import { validate as isUuid } from "uuid";
import { Teams } from "../enums/teams.enum";

describe("Player", () => {
  let player: Player;

  beforeEach(() => {
    player = new Player({ name: "Test", team: null });
  });

  it("Assigns a UUID on init", () => {
    expect(isUuid(player.id)).toBe(true);
  });

  it("makeSpymaster assigns player as spymaster", () => {
    player.makeSpymaster();

    expect(player.isSpymaster).toBe(true);
  });

  it("relinquishSpymaster unassigns player as spymaster", () => {
    player.relinquishSpymaster();

    expect(player.isSpymaster).toBe(false);
  });

  it("setTeam correctly sets the player's team", () => {
    player.setTeam(Teams.BLUE);

    expect(player.team).toBe(Teams.BLUE);
  });
});
