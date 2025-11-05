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

  const mockFile = {
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
  } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: TeamRepository, useValue: {
          create: jest.fn(), findByCoachId: jest.fn(), findByName: jest.fn(), findById: jest.fn(), findAll: jest.fn(), getByCoachId: jest.fn(),
        }},
        { provide: CloudinaryService, useValue: { uploadFile: jest.fn() }},
        { provide: PlayerService, useValue: { playerCountByTeamId: jest.fn() }},
        { provide: MailerService, useValue: { sendTemplateMail: jest.fn() }},
        { provide: CoachService, useValue: { findById: jest.fn(), findBySchoolId: jest.fn() }},
        { provide: UserService, useValue: { getAdminDetails: jest.fn() }},
        { provide: SchoolService, useValue: { findOneById: jest.fn() }},
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

  describe('createTeam', () => {
    it('should throw if coach already has a team', async () => {
      repo.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      await expect(service.createTeam('c1', mockFile, 'Team')).rejects.toThrow(BadRequestException);
      await expect(service.createTeam('c1', mockFile, 'Team')).rejects.toThrow(TEAM_MESSAGES.COACH_TEAM_EXISTS);
    });

    it('should throw if team name exists', async () => {
      repo.findByCoachId.mockResolvedValue(null);
      repo.findByName.mockResolvedValue({ id: 't1' } as any);
      await expect(service.createTeam('c1', mockFile, 'Team')).rejects.toThrow(TEAM_MESSAGES.NAME_EXISTS);
    });

    it('should create team successfully', async () => {
      repo.findByCoachId.mockResolvedValue(null);
      repo.findByName.mockResolvedValue(null);
      cloud.uploadFile.mockResolvedValue('logo-url');
      const created = { id: 't1', name: 'Team', logoUrl: 'logo-url' } as any;
      (repo.create as jest.Mock).mockResolvedValue(created);

      const res = await service.createTeam('c1', mockFile, 'Team');
      expect(cloud.uploadFile).toHaveBeenCalled();
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Team', coachId: 'c1', logoUrl: 'logo-url' }));
      expect(res).toEqual({ message: TEAM_MESSAGES.CREATED, team: created });
    });
  });

  describe('getTeamBySchoolId', () => {
    it('should throw when school not found', async () => {
      schools.findOneById.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(SCHOOL_ERRORS.SCHOOL_NOT_FOUND);
    });

    it('should throw when coach not found', async () => {
      schools.findOneById.mockResolvedValue({ id: 's1', name: 'School' } as any);
      coach.findBySchoolId.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(TEAM_MESSAGES.COACH_NOT_FOUND);
    });

    it('should throw when team not found', async () => {
      schools.findOneById.mockResolvedValue({ id: 's1', name: 'School' } as any);
      coach.findBySchoolId.mockResolvedValue({ id: 'c1' } as any);
      repo.getByCoachId.mockResolvedValue(null);
      await expect(service.getTeamBySchoolId('s1')).rejects.toThrow(TEAM_MESSAGES.TEAM_NOT_FOUND);
    });
  });
});
