import { sampleSize, shuffle } from "lodash";
import words from "../words";
import { Teams } from "../common/enums/teams.enum";
import { Card } from "../common/interfaces/card.interface";
import Game from "../common/classes/game.class";
import Player from "../common/classes/player.class";
import { UpdateParams } from "../common/types";

export default class GameService {
  private readonly games: Map<string, Game>;

  constructor() {
    this.games = new Map();
  }

  create(name: string): Game {
    const game = new Game(name);
    const cards = this.initCards(game);

    this.games.set(name, { ...game, cards });

    return { ...game, cards };
  }

  find(name: string): Game {
    const game = this.games.get(name);

    return game ? { ...game } : undefined;
  }

  findPlayer(game: Game, id: string): Player | undefined {
    return game.players.find((player) => player.id === id);
  }

  join(name: string, player: Player): [Game, Player] {
    const game = this.findOrFail(name);
    const joined = this.findPlayer(game, player.id);

    if (joined) {
      return this.reconnectPlayer(game, joined);
    }

    return this.addNewPlayer(game, player);
  }

  remove(name: string): boolean {
    return this.games.delete(name);
  }

  switchTeam(name: string, playerId: string) {
    const game = this.findOrFail(name);

    const player = game.players.find((p) => playerId === p.id);

    player.team = player.team === Teams.BLUE ? Teams.RED : Teams.BLUE;

    return player;
  }

  endTurn(name: string) {
    const game = this.findOrFail(name);

    const activeTeam = game.activeTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;

    return this.update(game, { activeTeam });
  }

  assignSpymaster(name: string, playerId: string) {
    const game = this.findOrFail(name);
    const player = game.players.find((p) => p.id === playerId);
    const spymaster = game.players.find(
      (p) => p.isSpymaster && p.team === player.team
    );

    if (spymaster) {
      throw new Error(`${spymaster.name} is already spymaster!`);
    }

    player.isSpymaster = true;

    return player;
  }

  revealCard(name: string, card: Card): Game {
    const game = this.findOrFail(name);
    const updateParams: UpdateParams<Game> = {};

    updateParams.cards = game.cards.map((c) =>
      c.word === card.word ? { ...c, isRevealed: true } : c
    );

    if (game.activeTeam !== card.team) {
      updateParams.activeTeam =
        game.activeTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;
    }

    if (this.checkForWin({ ...game, ...updateParams })) {
      updateParams.scores = game.scores;
      updateParams.scores[game.activeTeam]++;
      updateParams.gameOver = true;
    }

    return this.update(game, updateParams);
  }

  startGame(name: string) {
    const game = this.findOrFail(name);

    if (game.players.length < 4) {
      throw new Error("Not enough players!");
    }

    const spymasters = this.getSpymasters(game);

    if (!spymasters.red || !spymasters.blue) {
      throw new Error("Both teams need a spymaster!");
    }

    game.started = true;

    return game;
  }

  resetGame(name: string): Game {
    let game = this.findOrFail(name);
    const startingTeam =
      game.startingTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;

    const updateParams: UpdateParams<Game> = {
      ...game,
      startingTeam,
      activeTeam: startingTeam,
      started: false,
      gameOver: false,
      players: game.players.map((player) =>
        player.isSpymaster ? { ...player, isSpymaster: false } : player
      ),
      cards: this.initCards({ ...game, activeTeam: startingTeam }),
    };

    return this.update(game, updateParams);
  }

  removePlayer(name: string, playerId: string) {
    let game = this.findOrFail(name);
    const player = this.findPlayer(game, playerId);
    const players = game.players.filter((p) => p.id !== playerId);
    game = this.update(game, { players });

    if (game.players.length === 0) {
      this.remove(game.name);
    }

    return player;
  }

  disconnectPlayer(name: string, playerId: string) {
    const game = this.findOrFail(name);
    const player = this.findPlayer(game, playerId);
    const updatedPlayers = this.updatePlayerList(game.players, {
      ...player,
      disconnected: true,
    });

    return this.update(game, { players: updatedPlayers });
  }

  getSpymasters(game: Game) {
    return game.players.reduce(
      (obj, player) =>
        player.isSpymaster
          ? player.team === Teams.BLUE
            ? { ...obj, blue: player }
            : { ...obj, red: player }
          : obj,
      { red: null, blue: null }
    );
  }

  private reconnectPlayer(game: Game, player: Player): [Game, Player] {
    const updatedPlayer = { ...player, disconnected: false };
    const updatedGame = this.update(game, {
      players: this.updatePlayerList(game.players, updatedPlayer),
    });

    return [updatedGame, updatedPlayer];
  }

  private findOrFail(name: string): Game {
    const game = this.find(name);

    if (!game) {
      throw new Error("Game not found");
    }

    return { ...game };
  }

  private update(game: Game, params: UpdateParams<Game>): Game {
    const updated = { ...game, ...params };

    this.games.set(game.name, updated);

    return updated;
  }

  private addNewPlayer(game: Game, player: Player): [Game, Player] {
    let team = player.team;

    if (!team) {
      team = this.autoAssignTeam(game);
    }

    const newPlayer = new Player({ ...player, team });

    const players = [...game.players, newPlayer];

    game = this.update(game, { players });

    return [game, newPlayer];
  }

  private autoAssignTeam(game: Game): Teams {
    const numRed = game.players.filter((p) => p.team === Teams.RED).length;

    if (numRed > game.players.length / 2) {
      return Teams.BLUE;
    }

    if (numRed === game.players.length / 2) {
      return Math.random() < 0.5 ? Teams.RED : Teams.BLUE;
    }

    return Teams.RED;
  }

  private updatePlayerList(playerList: Player[], player: Player) {
    return playerList.map((p) => (p.id === player.id ? player : p));
  }

  private initCards(game: Game): Card[] {
    return shuffle(
      sampleSize(words, 25).map((word, i) => ({
        word,
        team:
          i > 0 && i < 10
            ? game.activeTeam
            : i > 9 && i < 18
            ? game.activeTeam === Teams.BLUE
              ? Teams.RED
              : Teams.BLUE
            : null,
        isRevealed: false,
        isAssassin: i === 0,
      }))
    );
  }

  private checkForWin(game: Game): boolean {
    const winByAssassin = game.cards.some(
      (card) => card.isAssassin && card.isRevealed
    );
    const winByReveal = !game.cards.some(
      (card) => !card.isRevealed && card.team === game.activeTeam
    );

    return winByAssassin || winByReveal;
  }
}
