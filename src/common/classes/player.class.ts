import { Teams } from "../enums/teams.enum";
import { v4 as uuid } from "uuid";
import { CreatePlayerDTO } from "../dtos/create-player.dto";

export default class Player {
  id: string;
  name: string;
  team: Teams;
  isSpymaster: boolean;
  disconnected: boolean;

  constructor(dto: CreatePlayerDTO) {
    this.id = dto.id || uuid();
    this.name = dto.name;
    this.team = dto.team;
    this.isSpymaster = false;
    this.disconnected = false;
  }
}
