import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { TeamRepository } from './team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { PlayerService } from 'src/player/player.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { UserService } from 'src/user/user.service';
import { SchoolService } from 'src/school/school.service';
import { BadRequestException } from '@nestjs/common';
import { TEAM_MESSAGES } from './team.constant';
import { SCHOOL_ERRORS } from 'src/school/school.constants';

describe('TeamService', () => {
  let service: TeamService;
  let repo: jest.Mocked<TeamRepository>;
  let cloud: jest.Mocked<CloudinaryService>;
  let players: jest.Mocked<PlayerService>;
  let mailer: jest.Mocked<MailerService>;
  let coach: jest.Mocked<CoachService>;
  let users: jest.Mocked<UserService>;
  let schools: jest.Mocked<SchoolService>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('test'),
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  };

  const mockTeam = {
    id: 't1',
    name: 'Team',
    logoUrl: 'logo-url',
    coach: { user: { name: 'Coach1', email: 'coach@test.com' } },
    players: [{ name: 'P1', age: 12 }],
    get: function () { return this; },
  } as any;

  const mockCoach = {
    id: 'c1',
    user: { name: 'Coach1', email: 'coach@test.com' },
  } as any;

  const mockAdmin = {
    name: 'Admin',
    email: 'admin@test.com',
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: TeamRepository, useValue: {
          create: jest.fn(),
          findByCoachId: jest.fn(),
          findByName: jest.fn(),
          findById: jest.fn(),
          findAll: jest.fn(),
          getByCoachId: jest.fn(),
        }},
        { provide: CloudinaryService, useValue: { uploadFile: jest.fn() } },
        { provide: PlayerService, useValue: { playerCountByTeamId: jest.fn() } },
        { provide: MailerService, useValue: { sendTemplateMail: jest.fn() } },
        { provide: CoachService, useValue: { findById: jest.fn(), findBySchoolId: jest.fn() } },
        { provide: UserService, useValue: { getAdminDetails: jest.fn() } },
        { provide: SchoolService, useValue: { findOneById: jest.fn() } },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
    repo = module.get(TeamRepository);
    cloud = module.get(CloudinaryService);
    players = module.get(PlayerService);
    mailer = module.get(MailerService);
    coach = module.get(CoachService);
    users = module.get(UserService);
    schools = module.get(SchoolService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateLogo', () => {
    it('should throw if file missing', () => {
      expect(() => (service as any).validateLogo(null)).toThrow(TEAM_MESSAGES.LOGO_REQUIRED);
    });

    it('should throw if invalid mimetype', () => {
      expect(() => (service as any).validateLogo({ ...mockFile, mimetype: 'text/plain' } as any))
        .toThrow(TEAM_MESSAGES.INVALID_FILE_TYPE);
    });

    it('should throw if file too large', () => {
      expect(() => (service as any).validateLogo({ ...mockFile, size: 3 * 1024 * 1024 } as any))
        .toThrow(TEAM_MESSAGES.FILE_TOO_LARGE);
    });
  });

  describe('createTeam', () => {
    it('should throw if coach already has a team', async () => {
      repo.findByCoachId.mockResolvedValue(mockTeam);
      await expect(service.createTeam('c1', mockFile, 'Team')).rejects.toThrow(TEAM_MESSAGES.COACH_TEAM_EXISTS);
    });

    it('should throw if name exists', async () => {
      repo.findByCoachId.mockResolvedValue(null);
      repo.findByName.mockResolvedValue(mockTeam);
      await expect(service.createTeam('c1', mockFile, 'Team')).rejects.toThrow(TEAM_MESSAGES.NAME_EXISTS);
    });

    it('should create team successfully', async () => {
      repo.findByCoachId.mockResolvedValue(null);
      repo.findByName.mockResolvedValue(null);
      cloud.uploadFile.mockResolvedValue('logo-url');
      repo.create.mockResolvedValue(mockTeam);

      const res = await service.createTeam('c1', mockFile, 'Team');
      expect(cloud.uploadFile).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalled();
      expect(res).toEqual({ message: TEAM_MESSAGES.CREATED, team: mockTeam });
    });
  });

  describe('submitTeam', () => {
    it('should throw if team not found', async () => {
      repo.findByCoachId.mockResolvedValue(null);
      await expect(service.submitTeam('c1')).rejects.toThrow(TEAM_MESSAGES.TEAM_NOT_FOUND);
    });

    it('should throw if players < min', async () => {
      repo.findByCoachId.mockResolvedValue(mockTeam);
      players.playerCountByTeamId.mockResolvedValue(0);
      coach.findById.mockResolvedValue(mockCoach);
      await expect(service.submitTeam('c1')).rejects.toThrow(TEAM_MESSAGES.MIN_PLAYERS_REQUIRED);
    });

    it('should throw if players > max', async () => {
      repo.findByCoachId.mockResolvedValue(mockTeam);
      players.playerCountByTeamId.mockResolvedValue(6);
      coach.findById.mockResolvedValue(mockCoach);
      await expect(service.submitTeam('c1')).rejects.toThrow(TEAM_MESSAGES.MAX_PLAYERS_EXCEEDED);
    });

    it('should send emails successfully', async () => {
      repo.findByCoachId.mockResolvedValue(mockTeam);
      players.playerCountByTeamId.mockResolvedValue(3);
      coach.findById.mockResolvedValue(mockCoach);
      users.getAdminDetails.mockResolvedValue(mockAdmin);

      const res = await service.submitTeam('c1');
      expect(mailer.sendTemplateMail).toHaveBeenCalledTimes(2);
      expect(res).toEqual({ message: TEAM_MESSAGES.TEAM_SUBMITTED, team: mockTeam });
    });

    it('should handle missing coach email', async () => {
      const teamNoEmail = { ...mockTeam, coach: { user: {} } } as any;
      repo.findByCoachId.mockResolvedValue(teamNoEmail);
      players.playerCountByTeamId.mockResolvedValue(3);
      coach.findById.mockResolvedValue(mockCoach);
      users.getAdminDetails.mockResolvedValue(mockAdmin);

      const res = await service.submitTeam('c1');
      expect(res).toEqual({ message: TEAM_MESSAGES.TEAM_SUBMITTED, team: teamNoEmail });
    });
  });

  describe('getTeamBySchoolId', () => {
    it('should throw if school not found', async () => {
      schools.findOneById.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(SCHOOL_ERRORS.SCHOOL_NOT_FOUND);
    });

    it('should throw if coach not found', async () => {
      schools.findOneById.mockResolvedValue({ id: 's1', name: 'School' } as any);
      coach.findBySchoolId.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(TEAM_MESSAGES.COACH_NOT_FOUND);
    });

    it('should throw if team not found', async () => {
      schools.findOneById.mockResolvedValue({ id: 's1', name: 'School' } as any);
      coach.findBySchoolId.mockResolvedValue(mockCoach);
      repo.getByCoachId.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(TEAM_MESSAGES.TEAM_NOT_FOUND);
    });

    it('should return formatted team details', async () => {
      schools.findOneById.mockResolvedValue({ id: 's1', name: 'School' } as any);
      coach.findBySchoolId.mockResolvedValue(mockCoach);
      repo.getByCoachId.mockResolvedValue(mockTeam);

      const res = await service.getTeamBySchoolId('s1');
      expect(res.schoolName).toBe('School');
      expect(res.teamName).toBe(mockTeam.name);
      expect(res.coachName).toBe(mockTeam.coach.user.name);
    });
  });


  describe('getAllTeams', () => {
    it('should return formatted teams', async () => {
      repo.findAll.mockResolvedValue([mockTeam] as any);
      const res = await service.getAllTeams();
      expect(res.teams[0].coachName).toBe('Coach1');
      expect(res.teams[0].players.length).toBe(1);
    });

    it('should handle missing coach and players gracefully', async () => {
      const teamNoCoach = { ...mockTeam, coach: null, players: null } as any;
      repo.findAll.mockResolvedValue([teamNoCoach]);
      const res = await service.getAllTeams();
      expect(res.teams[0].coachName).toBeNull();
      expect(res.teams[0].players).toEqual([]);
    });
  });

  it('getTeamByCoach should call repo', async () => {
    repo.findByCoachId.mockResolvedValue(mockTeam);
    const res = await service.getTeamByCoach('c1');
    expect(res).toEqual(mockTeam);
  });

  it('getTeamById should call repo', async () => {
    repo.findById.mockResolvedValue(mockTeam);
    const res = await service.getTeamById('t1');
    expect(res).toEqual(mockTeam);
  });
});
