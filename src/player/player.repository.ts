import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Player } from './entities/player.entity';
import { CreationAttributes } from 'sequelize';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';

@Injectable()
export class PlayerRepository {
  constructor(@InjectModel(Player) private readonly playerModel: typeof Player) {}

  async create(data: CreationAttributes<Player>) {
    return await this.playerModel.create(data);
  }

  async countByTeamId(teamId: string) {
    return await this.playerModel.count({ where: { teamId } });
  }

  async findByJersey(teamId: string, jerseyNumber: number) {
    return await this.playerModel.findOne({ where: { teamId, jerseyNumber } });
  }

  async findAllByTeam(teamId: string) {
    return await this.playerModel.findAll({ where: { teamId } });
  }

  async findById(id: string) {
    return await this.playerModel.findOne({ where: { id } });
  }

  async updatePlayerStatus(dto:UpdatePlayerStatusDto){
    return await this.playerModel.update(
    { isApproved: dto.isApproved },
    { where: { id: dto.playerId } }
  );
  }

}
