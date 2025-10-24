import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SchoolRepository } from './school.repository';
import { CreateSchoolDto } from './dto/create-school.dto';
import { SCHOOL_ERRORS } from './school.constants';

@Injectable()
export class SchoolService {
  constructor(private readonly schoolRepository: SchoolRepository) {}

  async create(createSchoolDto: CreateSchoolDto) {
    const { name, city } = createSchoolDto;

    const existingSchool = await this.schoolRepository.findByNameAndCity(name, city);
    if (existingSchool) {
      throw new HttpException(
        SCHOOL_ERRORS.DUPLICATE_SCHOOL(name, city),
        HttpStatus.CONFLICT,
      );
    }

    return this.schoolRepository.create(createSchoolDto);
  }

  findOneById(id: string) {
    return this.schoolRepository.findOneById(id);
  }

  findByNameAndCity(name: string, city: string) {
    return this.schoolRepository.findByNameAndCity(name, city);
  }
}
