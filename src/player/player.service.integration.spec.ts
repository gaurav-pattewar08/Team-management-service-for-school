import { Test, TestingModule } from '@nestjs/testing';
import { SequelizeModule } from '@nestjs/sequelize';
import { INestApplication, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PlayerService } from './player.service';
import { PlayerRepository } from './player.repository';
import { TeamRepository } from 'src/team/team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { Team } from 'src/team/entities/team.entity';
import { Player } from './entities/player.entity';
import { Coach } from 'src/coach/entities/coach.entity';
import { User } from 'src/user/entities/user.entity';
import { School } from 'src/school/entities/school.entity';
import { Role } from 'src/common/roles.enum';
import { CoachRepository } from 'src/coach/coach.repository';
import { SchoolRepository } from 'src/school/school.repository';
import { UserRepository } from 'src/user/user.repository';
import { UserService } from 'src/user/user.service';
import { SchoolService } from 'src/school/school.service';
import { PlayerModule } from './player.module';
import { CoachModule } from 'src/coach/coach.module';
import { UserModule } from 'src/user/user.module';
import { SchoolModule } from 'src/school/school.module';

jest.setTimeout(30000);

describe('PlayerService Integration Tests', () => {
  let app: INestApplication;
  let playerService: PlayerService;
  let teamRepo: TeamRepository;
  let playerRepo: PlayerRepository;
  let coachService: CoachService;
  let userService: UserService;
  let schoolService: SchoolService;

  const mockCloudinary = {
    uploadFile: jest.fn().mockResolvedValue('http://fake-cloudinary-url/player.png'),
  };

  const mockMailerService = {
    sendTemplateMail: jest.fn().mockResolvedValue({ messageId: 'fake-msg-id' }),
  };

  let testSchool: School;
  let testUser: User;
  let testCoach: Coach;
  let testTeam: Team;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        PlayerModule,
        CoachModule,
        UserModule,
        SchoolModule,
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
        PlayerService,
        PlayerRepository,
        TeamRepository,
        CoachService,
        UserService,
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

    playerService = module.get<PlayerService>(PlayerService);
    coachService = module.get<CoachService>(CoachService);
    userService = module.get<UserService>(UserService);
    schoolService = module.get<SchoolService>(SchoolService);
    teamRepo = module.get<TeamRepository>(TeamRepository);
    playerRepo = module.get<PlayerRepository>(PlayerRepository);

    testSchool = await schoolService.create({ name: 'Test School', city: 'Test City' });
    testUser = await userService.create({ name: 'Coach User', email: 'coach@test.com', password: 'hashedpassword', role: Role.COACH });
    testCoach = await coachService.create({ userId: testUser.id, schoolId: testSchool.id, isVerified: true });

    testTeam = await teamRepo.create({ name: 'Test Team', coachId: testCoach.id, logoUrl: 'http://fake-cloudinary-url/logo.png' } as any);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await Player.destroy({ where: {}, force: true });
    jest.clearAllMocks();
  });

  const createFakeFile = (): Express.Multer.File => ({
    originalname: 'player.png',
    mimetype: 'image/png',
    buffer: Buffer.from('fake-image'),
    size: 1024,
  } as Express.Multer.File);

  describe('addPlayer', () => {
    it('should add a player successfully', async () => {
      const result = await playerService.addPlayer(testCoach.id, {
        name: 'Player 1',
        dob: '2013-01-01',
        jerseyNumber: 10,
      }, createFakeFile());
      const updatedResult= result.player.get({plain:true})
      expect(updatedResult).toBeDefined();
      expect(updatedResult.name).toBe('Player 1');
      expect(updatedResult.photoUrl).toBe('http://fake-cloudinary-url/player.png');
    });

    it('should throw ForbiddenException if coach has no team', async () => {
      await expect(playerService.addPlayer('invalid-coach-id', {
        name: 'Player 2',
        dob: '2013-01-01',
        jerseyNumber: 11,
      }, createFakeFile())).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if jersey number is duplicate', async () => {
      await playerService.addPlayer(testCoach.id, { name: 'P1', dob: '2013-01-01', jerseyNumber: 5 }, createFakeFile());
      await expect(playerService.addPlayer(testCoach.id, { name: 'P2', dob: '2013-01-01', jerseyNumber: 5 }, createFakeFile()))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if age is invalid', async () => {
      await expect(playerService.addPlayer(testCoach.id, { name: 'P3', dob: '2000-01-01', jerseyNumber: 6 }, createFakeFile()))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('playerCountByTeamId', () => {
    it('should return the number of players in a team', async () => {
      await playerService.addPlayer(testCoach.id, { name: 'P1', dob: '2013-01-01', jerseyNumber: 1 }, createFakeFile());
      await playerService.addPlayer(testCoach.id, { name: 'P2', dob: '2013-01-01', jerseyNumber: 2 }, createFakeFile());

      const count = await playerService.playerCountByTeamId(testTeam.id);
      expect(count).toBe(2);
    });
  });

  describe('updatePlayerStatus', () => {
    it('should update player status and send mail', async () => {
      const { player } = await playerService.addPlayer(testCoach.id, { name: 'P1', dob: '2013-01-01', jerseyNumber: 3 }, createFakeFile());

      const dto = { playerId: player.id, isApproved: true };
      const result = await playerRepo.updatePlayerStatus(dto);

      expect(result).toBeDefined();
      expect(result).toEqual([1]);
    });

    it('should throw NotFoundException if player does not exist', async () => {
      await expect(playerService.updatePlayerStatus({ playerId: 'invalid-id', isApproved: true }))
        .rejects.toThrow(NotFoundException);
    });
  });
});
