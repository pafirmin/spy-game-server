import { Teams } from "../../enums/teams.enum";
import { v4 as uuid } from "uuid";
import { CreatePlayerDTO } from "../../dtos/create-player.dto";
import { PlayerDTO } from "../../dtos/player.dto";

export default class Player {
  private _id: string;
  private _name: string;
  private _team: Teams | null;
  private _isSpymaster: boolean;

  constructor(dto: CreatePlayerDTO) {
    this._id = uuid();
    this._name = dto.name;
    this._team = dto.team;
  }

  get id() {
    return this._id;
  }

  get name() {
    return this._name;
  }

  get team() {
    return this._team;
  }

  get isSpymaster() {
    return this._isSpymaster;
  }

  makeSpymaster() {
    this._isSpymaster = true;

    return this;
  }

  relinquishSpymaster() {
    this._isSpymaster = false;

    return this;
  }

  setTeam(team: Teams) {
    this._team = team;

    return this;
  }

  toJSON(): PlayerDTO {
    return {
      id: this._id,
      name: this._name,
      team: this._team,
      isSpymaster: this._isSpymaster,
    };
  }
}
