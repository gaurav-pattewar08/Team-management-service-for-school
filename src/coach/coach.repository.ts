import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreationAttributes } from 'sequelize';
import { Coach } from './entities/coach.entity';
import { CreateCoachDto } from './dto/create-coach.dto';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CoachRepository {
  constructor(@InjectModel(Coach) private coachModel: typeof Coach) {}

  async create(createCoachDto: CreateCoachDto) {
    return await this.coachModel.create(
      createCoachDto as CreationAttributes<Coach>,
    );
  }

  async findCoachBySchoolId(schoolId: string) {
    return await this.coachModel.findOne({ where: { schoolId } });
  }

  async findByPk(id: string) {
    return await this.coachModel.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'name'],
        },
      ],
    });
  }

  async findCoachByUserId(userId: string) {
    return await this.coachModel.findOne({ where: { userId } });
  }
}
