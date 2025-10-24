import { Module } from '@nestjs/common';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { SchoolRepository } from './school.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { School } from './entities/school.entity';
import { ResponseService } from 'src/common/response.service';


@Module({
  imports: [
    SequelizeModule.forFeature([School]),
  ],
  controllers: [SchoolController],
  providers: [SchoolService,SchoolRepository,ResponseService],
  exports: [SchoolService,SchoolRepository],
})
export class SchoolModule {}
