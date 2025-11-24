import { INestApplication, HttpStatus, ValidationPipe, CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';

import { TeamModule } from './team.module';
import { TeamController } from './team.controller';
import { Team } from './entities/team.entity';
import { Player } from 'src/player/entities/player.entity';
import { Coach } from 'src/coach/entities/coach.entity';
import { School } from 'src/school/entities/school.entity';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/common/roles.enum';
import { TEAM_MESSAGES } from './team.constant';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { MailerService } from 'src/common/mailer.service';
import { ResponseService } from 'src/common/response.service';
import { ConfigModule } from '@nestjs/config';
import { PlayerModule } from 'src/player/player.module';
import { CoachModule } from 'src/coach/coach.module';
import { UserModule } from 'src/user/user.module';
import { SchoolModule } from 'src/school/school.module';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    req.user = { id: 'user-uuid', role: Role.COACH, coachId: 'coach-uuid' };
    return true;
  }
}

class MockRolesGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

class MockCoachVerifiedGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('TeamController (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        SequelizeModule.forFeature([Team, Player, Coach, School, User]),
        TeamModule,
        PlayerModule,
        CoachModule,
        UserModule,
        SchoolModule,
      ],
      controllers: [TeamController],
      providers: [
        ResponseService,
        {
          provide: CloudinaryService,
          useValue: {
            uploadFile: jest.fn().mockResolvedValue('http://mock.logo.png'),
          },
        },
        {
          provide: MailerService,
          useValue: { sendTemplateMail: jest.fn().mockResolvedValue(true) },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockRolesGuard)
      .overrideGuard(CoachVerifiedGuard)
      .useClass(MockCoachVerifiedGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    await School.create({ id: 'school-uuid', name: 'Test School', city: 'Pune' } as any);
    await User.create({ id: 'user-uuid', name: 'Coach One', email: 'coach@example.com', password: 'hashedPass', role: Role.COACH } as any);
    await Coach.create({ id: 'coach-uuid', userId: 'user-uuid', schoolId: 'school-uuid', isVerified: true } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/POST /team/create', () => {
 
  it('should fail when no logo is provided', async () => {
    const res = await request(app.getHttpServer())
      .post('/team/create')
      .field('name', 'No Logo Team');

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.message).toBe(TEAM_MESSAGES.LOGO_REQUIRED);
  });
});


  describe('/POST /team/submit', () => {
    it('should fail if team not found', async () => {
      const res = await request(app.getHttpServer()).post('/team/submit');
      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body.message).toBe(TEAM_MESSAGES.TEAM_NOT_FOUND);
    });
  });

  describe('/GET /team/all', () => {
    it('should return list of teams', async () => {
      const res = await request(app.getHttpServer()).get('/team/all');
      expect(res.status).toBe(HttpStatus.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('/GET /team/school/:schoolId', () => {
    it('should return 400 when school not found', async () => {
      const res = await request(app.getHttpServer()).get('/team/school/unknown-id');
      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    });
  });
});
