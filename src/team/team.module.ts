import { forwardRef, Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Team } from './entities/team.entity';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';
import { CoachModule } from 'src/coach/coach.module';
import { ResponseService } from 'src/common/response.service';
import { PlayerModule } from 'src/player/player.module';
import { MailerService } from 'src/common/mailer.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [SequelizeModule.forFeature([Team]),CoachModule,forwardRef(() => PlayerModule),UserModule],
  controllers: [TeamController],
  providers: [TeamService,TeamRepository,CloudinaryService,CoachVerifiedGuard,ResponseService,MailerService],
  exports: [TeamService,TeamRepository],
})
export class TeamModule {}
