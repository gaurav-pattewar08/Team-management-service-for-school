import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { INestApplication, HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { CoachService } from '../coach/coach.service';
import { CoachRepository } from '../coach/coach.repository';
import { SchoolService } from '../school/school.service';
import { SchoolRepository } from '../school/school.repository';
import { MailerService } from '../common/mailer.service';

import { User } from '../user/entities/user.entity';
import { Coach } from '../coach/entities/coach.entity';
import { School } from '../school/entities/school.entity';
import { Team } from '../team/entities/team.entity';
import { Player } from '../player/entities/player.entity';
import { Role } from '../common/roles.enum';

jest.setTimeout(30000);

describe('AuthService Integration Tests', () => {
  let app: INestApplication;
  let module: TestingModule;
  let authService: AuthService;
  let userService: UserService;
  let coachService: CoachService;
  let schoolService: SchoolService;
  let mailerService: MailerService;
  let testSchool: School;

  const mockMailerService = {
    sendTemplateMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),

        SequelizeModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            dialect: 'sqlite',
            storage: ':memory:',
            autoLoadModels: true,
            synchronize: true,
            logging: false,
            models: [User, Coach, School, Team, Player],
          }),
        }),

        SequelizeModule.forFeature([User, Coach, School, Team, Player]),

        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET') || 'test-secret',
            signOptions: { expiresIn: '24h' },
          }),
        }),
      ],

      providers: [
        AuthService,
        UserService,
        UserRepository,
        CoachService,
        CoachRepository,
        SchoolService,
        SchoolRepository,
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    coachService = module.get<CoachService>(CoachService);
    schoolService = module.get<SchoolService>(SchoolService);
    mailerService = module.get<MailerService>(MailerService);

    testSchool = await schoolService.create({
      name: 'Test School',
      city: 'Test City',
    });
  });

  afterAll(async () => {
  await module?.close();
});


  beforeEach(async () => {
    await Promise.all([
      User.destroy({ where: {}, force: true }),
      Coach.destroy({ where: {}, force: true }),
      Team.destroy({ where: {}, force: true }),
      Player.destroy({ where: {}, force: true }),
    ]);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new coach and create user, coach records', async () => {
      const registerDto = {
        name: 'John Coach',
        email: 'john@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Test School',
        schoolCity: 'Test City',
      };

      const result = await authService.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(registerDto.email);
      expect(result.user.name).toBe(registerDto.name);
      expect(result.user.role).toBe(Role.COACH);

      const user = await userService.findByEmail(registerDto.email);
      expect(user).toBeDefined();
      expect(user?.name).toBe(registerDto.name);

      const coach = await coachService.findByUserId(user!.id);
      expect(coach).toBeDefined();
      expect(coach?.isVerified).toBe(false);
      expect(coach?.schoolId).toBe(testSchool.id);

      expect(mockMailerService.sendTemplateMail).toHaveBeenCalledWith(
        registerDto.email,
        'Verify your email - IPL App',
        'verify-email',
        expect.objectContaining({
          name: registerDto.name,
        }),
      );
    });

    it('should throw error when email already exists', async () => {
      const dto = {
        name: 'John Coach',
        email: 'existing@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Test School',
        schoolCity: 'Test City',
      };
      await authService.register(dto);
      await expect(authService.register(dto)).rejects.toThrow(HttpException);
    });

    it('should throw error when school does not exist', async () => {
      const dto = {
        name: 'John Coach',
        email: 'john2@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Non-existent School',
        schoolCity: 'Test City',
      };
      await expect(authService.register(dto)).rejects.toThrow(HttpException);
    });

    it('should throw error when school already has a coach', async () => {
      const dto1 = {
        name: 'First Coach',
        email: 'first@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Test School',
        schoolCity: 'Test City',
      };
      const dto2 = {
        name: 'Second Coach',
        email: 'second@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Test School',
        schoolCity: 'Test City',
      };
      await authService.register(dto1);
      await expect(authService.register(dto2)).rejects.toThrow(HttpException);
    });

    it('should hash password before storing', async () => {
      const dto = {
        name: 'Hashed Coach',
        email: 'hashed@test.com',
        password: 'Password123!',
        role: Role.COACH,
        schoolName: 'Test School',
        schoolCity: 'Test City',
      };
      await authService.register(dto);
      const user = await userService.findByEmail(dto.email);
      expect(user?.password).not.toBe(dto.password);
      expect(user?.password).toHaveLength(60);
      const isValid = await bcrypt.compare(dto.password, user!.password);
      expect(isValid).toBe(true);
    });
  });

  
  describe('login', () => {
    let testUser: User;
    const testPassword = 'Password123!';

    beforeEach(async () => {
      testUser = await userService.create({
        name: 'Test User',
        email: 'testuser@test.com',
        password: await bcrypt.hash(testPassword, 10),
        role: Role.COACH,
      });
    });

    it('should login successfully with valid credentials', async () => {
      const result = await authService.login('testuser@test.com', testPassword);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('testuser@test.com');
    });

    it('should throw error with invalid email', async () => {
      await expect(
        authService.login('nonexistent@test.com', testPassword),
      ).rejects.toThrow(HttpException);
    });

    it('should throw error with invalid password', async () => {
      await expect(
        authService.login('testuser@test.com', 'WrongPassword'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verifyEmail', () => {
    let testUser: User;
    let testCoach: Coach;
    let verificationToken: string;
    let jwtService: JwtService;

    beforeEach(async () => {
      jwtService = module.get<JwtService>(JwtService);
      testUser = await userService.create({
        name: 'Verify Coach',
        email: 'verify@test.com',
        password: await bcrypt.hash('Password123!', 10),
        role: Role.COACH,
      });

      testCoach = await coachService.create({
        userId: testUser.id,
        schoolId: testSchool.id,
        isVerified: false,
      });

      verificationToken = jwtService.sign({
        userId: testUser.id,
        coachId: testCoach.id,
      });
    });

    it('should verify email and update coach status', async () => {
      await authService.verifyEmail(verificationToken);
      const updatedCoach = await coachService.findById(testCoach.id);
      expect(updatedCoach?.isVerified).toBe(true);
    });

    it('should throw error with invalid token', async () => {
      await expect(authService.verifyEmail('invalid-token')).rejects.toThrow(
        HttpException,
      );
    });

    it('should throw error when coach does not exist', async () => {
      const fakeToken = jwtService.sign({
        userId: testUser.id,
        coachId: '00000000-0000-0000-0000-000000000000',
      });
      await expect(authService.verifyEmail(fakeToken)).rejects.toThrow(
        HttpException,
      );
    });
  });
});
