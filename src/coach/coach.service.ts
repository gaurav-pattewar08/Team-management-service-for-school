import { Injectable } from '@nestjs/common';
import { CoachRepository } from './coach.repository';
import { CreateCoachDto } from './dto/create-coach.dto';

@Injectable()
export class CoachService {
  constructor(private readonly coachRepository: CoachRepository) {}

  async create(createCoachDto: CreateCoachDto) {
    return await this.coachRepository.create(createCoachDto);
  }

  async findBySchoolId(schoolId: string) {
    return await this.coachRepository.findCoachBySchoolId(schoolId);
  }
   async findById(id: string) {
    return await this.coachRepository.findByPk(id);
  }

  async findByUserId(userId: string) {
    return await this.coachRepository.findCoachByUserId(userId);
  }
}
