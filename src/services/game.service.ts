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

    return { ...game };
  }

  find(name: string): Game {
    const game = this.games.get(name);

    return game;
  }

  findOrFail(name: string): Game {
    const game = this.find(name);

    if (!game) {
      throw new Error("Game not found");
    }

    return game;
  }

  update(name: string, params: UpdateParams<Game>): Game {
    const game = this.findOrFail(name);
    const updated = Object.assign(game, params);

    this.games.set(game.name, updated);

    return updated;
  }

  remove(name: string): boolean {
    return this.games.delete(name);
  }

  addPlayer(name: string, player: Player): Player {
    const game = this.findOrFail(name);

    if (!player.team) {
      player.team = this.autoAssignTeam(game);
    }

    player = new Player(player);

    const players = [...game.players, player];

    this.games.set(game.name, { ...game, players });

    return player;
  }

  switchTeam(name: string, playerId: string) {
    const game = this.findOrFail(name);
    const player = game.players.find((p) => playerId === p.id);

    player.team = player.team === Teams.BLUE ? Teams.RED : Teams.BLUE;

    return player;
  }

  endTurn(name: string) {
    const game = this.findOrFail(name);

    game.activeTeam = game.activeTeam === Teams.BLUE ? Teams.RED : Teams.BLUE;
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

    return this.update(game.name, updateParams);
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

    return this.update(game.name, updateParams);
  }

  removePlayer(name: string, playerId: string) {
    const game = this.findOrFail(name);
    const player = game.players.find((p) => p.id === playerId);
    game.players = game.players.filter((p) => p.id !== playerId);

    if (game.players.length === 0) {
      this.remove(game.name);
    }

    return player;
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

  private autoAssignTeam(game: Game): Teams {
    const counts = game.players.reduce(
      (count, player) => {
        if (player.team === Teams.BLUE) {
          count.blue++;
        } else {
          count.red++;
        }
        return count;
      },
      { blue: 0, red: 0 }
    );

    let team: Teams;

    if (counts.red === counts.blue) {
      team = Math.floor(Math.random() * 2) + 1 === 1 ? Teams.RED : Teams.BLUE;
    } else {
      team = counts.red > counts.blue ? Teams.BLUE : Teams.RED;
    }

    return team;
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
