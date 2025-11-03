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

 async findAll() {
    return await this.schoolModel.findAll();
  }

  async findOneById(id: string) {
    return await this.schoolModel.findByPk(id);
  }

  async findByNameAndCity(name: string, city: string) {
    return await this.schoolModel.findOne({ where: { name, city } });
  }
}
