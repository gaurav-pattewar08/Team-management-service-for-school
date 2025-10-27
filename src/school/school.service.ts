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

    return await this.schoolRepository.create(createSchoolDto);
  }

  async findOneById(id: string) {
    return await this.schoolRepository.findOneById(id);
  }

  async findByNameAndCity(name: string, city: string) {
    return await this.schoolRepository.findByNameAndCity(name, city);
  }
}
