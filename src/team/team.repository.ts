import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreationAttributes } from 'sequelize';
import { Coach } from 'src/coach/entities/coach.entity';
import { User } from 'src/user/entities/user.entity';
import { Player } from 'src/player/entities/player.entity';

@Injectable()
export class TeamRepository {
  constructor(@InjectModel(Team) private readonly teamModel: typeof Team) {}

  async create(data: CreationAttributes<Team>) {
    return await this.teamModel.create(data);
  }

  async findByCoachId(coachId: string) {
    return await this.teamModel.findOne({
      where: { coachId },
      include: [Player],
    });
  }

  async findByName(name: string) {
    return await this.teamModel.findOne({ where: { name } });
  }

  async findById(id: string) {
    return await this.teamModel.findByPk(id, {
      include: [
        {
          model: Coach,
          include: [
            {
              model: User,
            },
          ],
        },
      ],
    });
  }

  async findAll() {
    return await this.teamModel.findAll({
      include: [
        {
          model: Coach,
          as: 'coach',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'email'],
            },
          ],
          attributes: ['id'],
        },
        {
          model: Player,
          attributes: [
            'id',
            'name',
            'dob',
            'jerseyNumber',
            'photoUrl',
            'isApproved',
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }
}
