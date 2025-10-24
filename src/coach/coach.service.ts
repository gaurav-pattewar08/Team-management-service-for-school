import { Injectable } from '@nestjs/common';
import { CoachRepository } from './coach.repository';
import { CreateCoachDto } from './dto/create-coach.dto';

@Injectable()
export class CoachService {
  constructor(private readonly coachRepository: CoachRepository) {}

  create(createCoachDto: CreateCoachDto) {
    return this.coachRepository.create(createCoachDto);
  }

  async findBySchoolId(schoolId: string) {
    return this.coachRepository.findCoachBySchoolId(schoolId);
  }
   findById(id: string) {
    return this.coachRepository.findByPk(id);
  }

  async findByUserId(userId: string) {
    return this.coachRepository.findCoachByUserId(userId);
  }
}
