import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { School } from 'src/school/entities/school.entity';
import { Coach } from 'src/coach/entities/coach.entity';
import { User } from 'src/user/entities/user.entity';
import { Team } from 'src/team/entities/team.entity';
import { Player } from 'src/player/entities/player.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        models: [School,Coach,User,Team,Player],
        autoLoadModels: true,
        synchronize: true,
      }),
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private readonly sequelize: Sequelize) {}

  async onModuleInit() {
    try {
      await this.sequelize.authenticate();
      Logger.log('✅ Database connected successfully', 'Sequelize');
    } catch (error) {
      Logger.error('❌ Database connection failed', error, 'Sequelize');
    }
  }
}
