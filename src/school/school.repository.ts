// school/school.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { School } from './entities/school.entity';
import { CreationAttributes } from 'sequelize';
import { CreateSchoolDto } from './dto/create-school.dto';

@Injectable()
export class SchoolRepository {
  constructor(@InjectModel(School) private schoolModel: typeof School) {}

  async create(createSchoolDto: CreateSchoolDto) {
      return await this.schoolModel.create(
        createSchoolDto as CreationAttributes<School>,
      );
    } 

  findAll() {
    return this.schoolModel.findAll();
  }

  findOneById(id: string) {
    return this.schoolModel.findByPk(id);
  }

  findByNameAndCity(name: string, city: string) {
    return this.schoolModel.findOne({ where: { name, city } });
  }
}
