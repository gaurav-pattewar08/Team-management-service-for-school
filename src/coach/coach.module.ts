import { Module } from '@nestjs/common';
import { CoachService } from './coach.service';
import { CoachController } from './coach.controller';
import { CoachRepository } from './coach.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Coach } from './entities/coach.entity';

@Module({
  imports: [
      SequelizeModule.forFeature([Coach]),
    ],
  controllers: [CoachController],
  providers: [CoachService,CoachRepository],
  exports: [CoachService,CoachRepository],
  
})
export class CoachModule {}
