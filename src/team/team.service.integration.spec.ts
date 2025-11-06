import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { INestApplication, BadRequestException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { TeamService } from './team.service';
import { TeamRepository } from './team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { PlayerService } from 'src/player/player.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { UserService } from 'src/user/user.service';
import { SchoolService } from 'src/school/school.service';

import { Team } from './entities/team.entity';
import { Player } from 'src/player/entities/player.entity';
import { Coach } from 'src/coach/entities/coach.entity';
import { User } from 'src/user/entities/user.entity';
import { School } from 'src/school/entities/school.entity';
import { Role } from 'src/common/roles.enum';
import { CoachRepository } from 'src/coach/coach.repository';
import { SchoolRepository } from 'src/school/school.repository';
import { UserRepository } from 'src/user/user.repository';
import { CoachModule } from 'src/coach/coach.module';
import { SchoolModule } from 'src/school/school.module';
import { UserModule } from 'src/user/user.module';
import { PlayerModule } from 'src/player/player.module';

jest.setTimeout(30000);

describe('TeamService Integration Tests', () => {
  let app: INestApplication;
  let teamService: TeamService;
  let coachService: CoachService;
  let userService: UserService;
  let playerService: PlayerService;
  let schoolService: SchoolService;

  const mockCloudinary = {
    uploadFile: jest.fn().mockResolvedValue('http://fake-cloudinary-url/logo.png'),
  };
  const mockMailerService = {
    sendTemplateMail: jest.fn().mockResolvedValue({ messageId: 'fake-msg-id' }),
  };

  let testSchool: School;
  let testUser: User;
  let testCoach: Coach;
  let testTeam: Team;
  let adminUser: User;

  beforeAll(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      CoachModule,
      SchoolModule,
      UserModule,
      PlayerModule,
      SequelizeModule.forRoot({
        dialect: 'sqlite',
        storage: ':memory:',
        autoLoadModels: true,
        synchronize: true,
        logging: false,
        models: [User, Coach, School, Team, Player],
      }),
      SequelizeModule.forFeature([User, Coach, School, Team, Player]),
    ],
    providers: [
      TeamService,
      TeamRepository,
      CoachService,
      UserService,
      PlayerService,
      SchoolService,
      CoachRepository,
      SchoolRepository,
      UserRepository,
      { provide: CloudinaryService, useValue: mockCloudinary },
      { provide: MailerService, useValue: mockMailerService },
    ],
  })
  .overrideProvider(CloudinaryService) 
  .useValue(mockCloudinary)
  .compile();

  app = module.createNestApplication();
  await app.init();

  teamService = module.get<TeamService>(TeamService);
  coachService = module.get<CoachService>(CoachService);
  userService = module.get<UserService>(UserService);
  playerService = module.get<PlayerService>(PlayerService);
  schoolService = module.get<SchoolService>(SchoolService);

  testSchool = await schoolService.create({ name: 'Test School', city: 'Test City' });

  testUser = await userService.create({
    name: 'Coach User',
    email: 'coach@test.com',
    password: 'hashedpassword',
    role: Role.COACH,
  });

  adminUser = await userService.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'hashedpassword',
    role: Role.ADMIN,
  });

  testCoach = await coachService.create({
    userId: testUser.id,
    schoolId: testSchool.id,
    isVerified: true,
  });
});


  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await Team.destroy({ where: {}, force: true });
    await Player.destroy({ where: {}, force: true });
    jest.clearAllMocks();
  });

  const createFakeFile = (): Express.Multer.File => ({
    originalname: 'logo.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image'),
    size: 1024,
  } as Express.Multer.File);

  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      const result = await teamService.createTeam(testCoach.id, createFakeFile(), 'Test Team');

      expect(result.team).toBeDefined();

    });

    it('should throw error if coach already has a team', async () => {
      await teamService.createTeam(testCoach.id, createFakeFile(), 'Team 1');
      await expect(teamService.createTeam(testCoach.id, createFakeFile(), 'Team 2')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('submitTeam', () => {
    it('should submit team when player count is valid', async () => {
      testTeam = (await teamService.createTeam(testCoach.id, createFakeFile(), 'Test Team')).team;

      for (let i = 1; i <= 3; i++) {
        await playerService.addPlayer(testCoach.id, {
          name: `Player ${i}`,
          dob: '2013-01-01',
          jerseyNumber: i,
        }, createFakeFile());
      }

      const result = await teamService.submitTeam(testCoach.id);

      expect(result.message).toBeDefined();
    });

    it('should throw error if team has no players', async () => {
      testTeam = (await teamService.createTeam(testCoach.id, createFakeFile(), 'Test Team')).team;

      await expect(teamService.submitTeam(testCoach.id)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTeamByCoach', () => {
    it('should return team for coach', async () => {
      testTeam = (await teamService.createTeam(testCoach.id, createFakeFile(), 'Test Team')).team;

      const team = await teamService.getTeamByCoach(testCoach.id);
      expect(team).toBeDefined();
      expect(team!.id).toBe(testTeam.id);
    });
  });

  describe('getAllTeams', () => {
    it('should return all teams', async () => {
      await teamService.createTeam(testCoach.id, createFakeFile(), 'Team 1');
      const response = await teamService.getAllTeams();

      expect(response.teams.length).toBe(1);
      expect(response.teams[0].coachName).toBe(testUser.name);
    });
  });

  describe('getTeamById', () => {
    it('should return team by ID', async () => {
      testTeam = (await teamService.createTeam(testCoach.id, createFakeFile(), 'Test Team')).team;

      const team = await teamService.getTeamById(testTeam.id);
      expect(team!.id).toBe(testTeam.id);
    });
  });
});
