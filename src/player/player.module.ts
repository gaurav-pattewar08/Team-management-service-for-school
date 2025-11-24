import { forwardRef, Module } from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { PlayerRepository } from './player.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Player } from './entities/player.entity';
import { TeamModule } from 'src/team/team.module';
import { CoachModule } from 'src/coach/coach.module';
import { ResponseService } from 'src/common/response.service';
import { MailerService } from 'src/common/mailer.service';

@Module({
  imports: [SequelizeModule.forFeature([Player]),CoachModule,forwardRef(() => TeamModule)],
  controllers: [PlayerController],
  providers: [PlayerService,PlayerRepository,CloudinaryService,ResponseService,MailerService],
  exports: [PlayerService,PlayerRepository],
})
export class PlayerModule {}
