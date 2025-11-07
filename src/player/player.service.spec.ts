import { Test, TestingModule } from '@nestjs/testing';
import { PlayerService } from './player.service';
import { PlayerRepository } from './player.repository';
import { TeamRepository } from 'src/team/team.repository';
import { CloudinaryService } from 'src/common/cloudinary.service';
import { MailerService } from 'src/common/mailer.service';
import { CoachService } from 'src/coach/coach.service';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PLAYER_MESSAGES } from './player.constant';
import { UpdatePlayerStatusDto } from './dto/update-player-status.dto';

describe('PlayerService', () => {
  let service: PlayerService;
  let players: jest.Mocked<PlayerRepository>;
  let teams: jest.Mocked<TeamRepository>;
  let cloud: jest.Mocked<CloudinaryService>;
  let mailer: jest.Mocked<MailerService>;

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
        {
          provide: PlayerRepository,
          useValue: {
            create: jest.fn(),
            countByTeamId: jest.fn(),
            findByJersey: jest.fn(),
            findById: jest.fn(),
            updatePlayerStatus: jest.fn(),
          },
        },
        { provide: TeamRepository, useValue: { findByCoachId: jest.fn(), findById: jest.fn() } },
        { provide: CloudinaryService, useValue: { uploadFile: jest.fn() } },
        { provide: MailerService, useValue: { sendTemplateMail: jest.fn() } },
        { provide: CoachService, useValue: {} },
      ],
    }).compile();

    service = module.get<PlayerService>(PlayerService);
    players = module.get(PlayerRepository);
    teams = module.get(TeamRepository);
    cloud = module.get(CloudinaryService);
    mailer = module.get(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('playerCountByTeamId', () => {
    it('should return correct count', async () => {
      players.countByTeamId.mockResolvedValue(5);
      const count = await service.playerCountByTeamId('t1');
      expect(count).toBe(5);
      expect(players.countByTeamId).toHaveBeenCalledWith('t1');
    });
  });

  describe('updatePlayerStatus - Full Path', () => {
    const player = { id: 'p1', name: 'Player1', get: () => ({ id: 'p1', name: 'Player1', teamId: 't1' }) } as any;
    const team = { id: 't1', coach: { user: { email: 'coach@test.com', name: 'Coach1' } }, get: () => ({ coach: { user: { email: 'coach@test.com', name: 'Coach1' } } }) } as any;

    it('should throw when player not found', async () => {
      players.findById.mockResolvedValue(null);
      await expect(service.updatePlayerStatus({ playerId: 'p1', isApproved: true })).rejects.toThrow(NotFoundException);
    });

    it('should update and send email when approved', async () => {
      players.findById.mockResolvedValue(player);
      players.updatePlayerStatus.mockResolvedValue([1]);
      teams.findById.mockResolvedValue(team);

      const res = await service.updatePlayerStatus({ playerId: 'p1', isApproved: true });
      expect(res!.message).toBe('Player has been approved.');
      expect(mailer.sendTemplateMail).toHaveBeenCalledWith(
        'coach@test.com',
        'Player approved by Admin',
        'player-status',
        expect.objectContaining({ coachName: 'Coach1', playerName: 'Player1', statusText: 'approved' }),
      );
    });

    it('should update and send email when rejected', async () => {
      players.findById.mockResolvedValue(player);
      players.updatePlayerStatus.mockResolvedValue([1]);
      teams.findById.mockResolvedValue(team);

      const res = await service.updatePlayerStatus({ playerId: 'p1', isApproved: false });
      expect(res!.message).toBe('Player has been rejected.');
      expect(mailer.sendTemplateMail).toHaveBeenCalledWith(
        'coach@test.com',
        'Player rejected by Admin',
        'player-status',
        expect.objectContaining({ statusText: 'rejected' }),
      );
    });
  });

  describe('validatePhoto', () => {
    it('should throw if no file', () => {
      expect(() => (service as any).validatePhoto(null)).toThrow(PLAYER_MESSAGES.PHOTO_REQUIRED);
    });

    it('should throw if wrong mimetype', () => {
      expect(() => (service as any).validatePhoto({ ...mockFile, mimetype: 'text/plain' } as any))
        .toThrow(PLAYER_MESSAGES.INVALID_FILE_TYPE);
    });

    it('should throw if file too large', () => {
      expect(() => (service as any).validatePhoto({ ...mockFile, size: 3 * 1024 * 1024 } as any))
        .toThrow(PLAYER_MESSAGES.FILE_TOO_LARGE);
    });
  });

  describe('calculateAgeFromDob', () => {
    it('should calculate correct age', () => {
      const age = (service as any).calculateAgeFromDob('2005-01-01');
      const expectedAge = new Date().getUTCFullYear() - 2005;
      expect(age).toBe(expectedAge);
    });

    it('should handle birthday not yet occurred this year', () => {
      const today = new Date();
      const futureMonth = today.getUTCMonth() + 1 > 11 ? 0 : today.getUTCMonth() + 1;
      const dob = new Date(today.getUTCFullYear() - 20, futureMonth, today.getUTCDate() + 1);
      const age = (service as any).calculateAgeFromDob(dob.toISOString().split('T')[0]);
      expect(age).toBe(19);
    });
  });
});

