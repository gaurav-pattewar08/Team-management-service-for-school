import { Test, TestingModule } from '@nestjs/testing';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { ResponseService } from 'src/common/response.service';
import { BadRequestException } from '@nestjs/common';
import { PLAYER_MESSAGES } from './player.constant';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';

describe('PlayerController', () => {
  let controller: PlayerController;
  let service: jest.Mocked<PlayerService>;

  const mockFile = {
    fieldname: 'photo',
    originalname: 'p.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('x'),
    size: 100,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  } as Express.Multer.File;

  const invalidFile = { ...mockFile, mimetype: 'application/pdf' } as Express.Multer.File;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        { provide: PlayerService, useValue: { addPlayer: jest.fn(), updatePlayerStatus: jest.fn() } },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(CoachVerifiedGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    controller = module.get<PlayerController>(PlayerController);
    service = module.get(PlayerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addPlayer', () => {
    it('should throw when file missing', async () => {
      await expect(
        controller.addPlayer(
          undefined as any,
          { name: 'P', dob: '2010-01-01', jerseyNumber: 7 } as any,
          { user: { coachId: 'c1' } } as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });


    it('should call service and return response', async () => {
      service.addPlayer.mockResolvedValue({
        message: PLAYER_MESSAGES.CREATED,
        player: { id: 'p1' },
      } as any);

      const res = await controller.addPlayer(
        mockFile,
        { name: 'P', dob: '2010-01-01', jerseyNumber: 7 } as any,
        { user: { coachId: 'c1' } } as any,
      );

      expect(service.addPlayer).toHaveBeenCalledWith(
        'c1',
        { name: 'P', dob: '2010-01-01', jerseyNumber: 7 },
        mockFile,
      );
      expect(res).toEqual({ message: PLAYER_MESSAGES.CREATED, data: { id: 'p1' } });
    });

    it('should propagate errors from service', async () => {
      service.addPlayer.mockRejectedValue(new BadRequestException('Service Error'));
      await expect(
        controller.addPlayer(mockFile, { name: 'P', dob: '2010-01-01', jerseyNumber: 7 } as any, { user: { coachId: 'c1' } } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateStatus', () => {
    it('should call service and return message', async () => {
      service.updatePlayerStatus.mockResolvedValue({} as any);
      const res = await controller.updateStatus({ playerId: 'p1', isApproved: true } as any);
      expect(service.updatePlayerStatus).toHaveBeenCalledWith({ playerId: 'p1', isApproved: true });
      expect(res).toEqual({ message: PLAYER_MESSAGES.UPDATED_SUCCESS, data: null });
    });

    it('should propagate errors from service', async () => {
      service.updatePlayerStatus.mockRejectedValue(new BadRequestException('Service Error'));
      await expect(
        controller.updateStatus({ playerId: 'p1', isApproved: true } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
