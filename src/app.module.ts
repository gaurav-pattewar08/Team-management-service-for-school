import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { SchoolModule } from './school/school.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { CoachModule } from './coach/coach.module';
import { TeamModule } from './team/team.module';
import { PlayerModule } from './player/player.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.docker' : '.env',
    }),
    SchoolModule,
    UserModule,
    AuthModule,
    CoachModule,
    TeamModule,
    PlayerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
