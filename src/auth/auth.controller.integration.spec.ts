import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ResponseService } from 'src/common/response.service';
import { UserService } from 'src/user/user.service';
import { CoachService } from 'src/coach/coach.service';
import { SchoolService } from 'src/school/school.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MailerService } from 'src/common/mailer.service';
import { Role } from 'src/common/roles.enum';
import { User } from 'src/user/entities/user.entity';
import { Coach } from 'src/coach/entities/coach.entity';
import { School } from 'src/school/entities/school.entity';
import { USER_MESSAGES, USER_ERRORS } from 'src/user/user.constant';
import { AUTH_ERRORS, AUTH_SUCCESS } from './auth.constants';
import { UserModule } from 'src/user/user.module';
import { CoachModule } from 'src/coach/coach.module';
import { SchoolModule } from 'src/school/school.module';
import { Team } from 'src/team/entities/team.entity';
import { Player } from 'src/player/entities/player.entity';

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
        }),
        UserModule,CoachModule,SchoolModule,
        SequelizeModule.forFeature([User, Coach, School,Team,Player]),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        ResponseService,
        UserService,
        CoachService,
        SchoolService,
        {
          provide: MailerService,
          useValue: {
            sendTemplateMail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get(JwtService);
    await app.init();

    const schoolService = moduleRef.get(SchoolService);
    await schoolService.create({
      name: 'Test School',
      city: 'Pune',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/POST /auth/register', () => {
    const registerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'Password123!',
      role: Role.COACH,
      schoolName: 'Test School',
      schoolCity: 'Pune',
    };

    it('should register a new coach successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CREATED);

      expect(res.body).toBeDefined();
      expect(res.body.message).toBe(USER_MESSAGES.REGISTERED);
      expect(res.body.data.user.email).toBe(registerDto.email);
    });

    it('should return 409 if email already exists', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(HttpStatus.CONFLICT);

      expect(res.body.message).toBe(USER_ERRORS.EMAIL_EXISTS);
    });

    it('should return 404 if school not found', async () => {
      const dto = {
        ...registerDto,
        email: 'coach2@example.com',
        schoolName: 'Unknown School',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto)
        .expect(HttpStatus.NOT_FOUND);

      expect(res.body.message).toBe(AUTH_ERRORS.SCHOOL_NOT_FOUND);
    });
  });

  describe('/POST /auth/login', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should login successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(res.body.message).toBe(USER_MESSAGES.LOGIN_SUCCESS);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.email).toBe(loginDto.email);
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...loginDto, password: 'WrongPass' })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe(AUTH_ERRORS.INVALID_CREDENTIALS);
    });

  });

  describe('/GET /auth/verify-email', () => {
    let token: string;

    beforeAll(async () => {
      const coach = await Coach.findOne();
      token = jwtService.sign({ coachId: coach!.id });
    });

    it('should verify email successfully', async () => {
      const res = await request(app.getHttpServer())
        .get(`/auth/verify-email?token=${token}`)
        .expect(HttpStatus.OK);

      expect(res.body.message).toBe(AUTH_SUCCESS.EMAIL_VERIFIED);
    });

    it('should return 400 for invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/verify-email?token=invalid')
        .expect(HttpStatus.BAD_REQUEST);

      expect(res.body.message).toBe(AUTH_ERRORS.EMAIL_VERIFICATION_FAILED);
    });
  });
});
