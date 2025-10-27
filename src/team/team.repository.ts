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

   create(data: CreationAttributes<Team>) {
    return this.teamModel.create(data);
  }


  findByCoachId(coachId: string) {
    return this.teamModel.findOne({ where: { coachId }, include: [Player]});
  }

  findByName(name: string) {
    return this.teamModel.findOne({ where: { name } });
  }

  findById(id: string) {
    return this.teamModel.findByPk(id, {
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
}
