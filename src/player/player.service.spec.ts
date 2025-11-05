import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from './player.service';
import { PlayerRepository } from './player.repository';
import { TeamRepository } from 'src/team/team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PLAYER_MESSAGES } from './player.constant';


describe('PlayerService', () => {
  let service: PlayerService;
  let players: jest.Mocked<PlayerRepository>;
  let teams: jest.Mocked<TeamRepository>;
  let cloud: jest.Mocked<CloudinaryService>;
  let mailer: jest.Mocked<MailerService>;
  let coach: jest.Mocked<CoachService>;

  const mockFile = {
    fieldname: 'file',
    originalname: 'photo.png',
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
        PlayerService,
        { provide: PlayerRepository, useValue: {
          create: jest.fn(), countByTeamId: jest.fn(), findByJersey: jest.fn(), findAllByTeam: jest.fn(), findById: jest.fn(), updatePlayerStatus: jest.fn(),
        }},
        { provide: TeamRepository, useValue: { findByCoachId: jest.fn(), findById: jest.fn() }},
        { provide: CloudinaryService, useValue: { uploadFile: jest.fn() }},
        { provide: MailerService, useValue: { sendTemplateMail: jest.fn() }},
        { provide: CoachService, useValue: { findById: jest.fn() }},
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    players = module.get(PlayerRepository);
    teams = module.get(TeamRepository);
    cloud = module.get(CloudinaryService);
    mailer = module.get(MailerService);
    coach = module.get(CoachService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addPlayer', () => {
    it('should throw if team not found for coach', async () => {
      teams.findByCoachId.mockResolvedValue(null);
      await expect(service.addPlayer('c1', { name: 'P', dob: '2010-01-01', jerseyNumber: 7 }, mockFile)).rejects.toThrow(PLAYER_MESSAGES.UNAUTHORIZED);
    });

    it('should throw if team roster is full', async () => {
      teams.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      players.countByTeamId.mockResolvedValue(15);
      await expect(service.addPlayer('c1', { name: 'P', dob: '2010-01-01', jerseyNumber: 7 }, mockFile)).rejects.toThrow(PLAYER_MESSAGES.TEAM_LIMIT_EXCEEDED);
    });

    it('should throw if duplicate jersey number', async () => {
      teams.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      players.countByTeamId.mockResolvedValue(0);
      players.findByJersey.mockResolvedValue({ id: 'p1' } as any);
      await expect(service.addPlayer('c1', { name: 'P', dob: '2010-01-01', jerseyNumber: 7 }, mockFile)).rejects.toThrow(PLAYER_MESSAGES.DUPLICATE_JERSEY);
    });

    it('should throw on invalid age', async () => {
      teams.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      players.countByTeamId.mockResolvedValue(0);
      players.findByJersey.mockResolvedValue(null);
      await expect(service.addPlayer('c1', { name: 'P', dob: '2020-01-01', jerseyNumber: 7 }, mockFile)).rejects.toThrow(PLAYER_MESSAGES.AGE_LIMIT);
    });

    it('should throw on invalid file type', async () => {
      teams.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      players.countByTeamId.mockResolvedValue(0);
      players.findByJersey.mockResolvedValue(null);
      await expect(service.addPlayer('c1', { name: 'P', dob: '2010-01-01', jerseyNumber: 7 }, { ...mockFile, mimetype: 'application/pdf' } as any)).rejects.toThrow(PLAYER_MESSAGES.INVALID_FILE_TYPE);
    });

    it('should create player successfully', async () => {
      teams.findByCoachId.mockResolvedValue({ id: 't1' } as any);
      players.countByTeamId.mockResolvedValue(0);
      players.findByJersey.mockResolvedValue(null);
      cloud.uploadFile.mockResolvedValue('photo-url');
      const created = { id: 'p1', name: 'P' } as any;
      (players.create as jest.Mock).mockResolvedValue(created);

      const res = await service.addPlayer('c1', { name: 'P', dob: '2010-01-01', jerseyNumber: 7 }, mockFile);
      expect(cloud.uploadFile).toHaveBeenCalled();
      expect(players.create).toHaveBeenCalled();
      expect(res).toEqual({ message: PLAYER_MESSAGES.CREATED, player: created });
    });
  });

  describe('updatePlayerStatus', () => {
    it('should throw when player not found', async () => {
      players.findById.mockResolvedValue(null);
      await expect(service.updatePlayerStatus({ playerId: 'p1', isApproved: true })).rejects.toThrow(NotFoundException);
    });
  });
});
