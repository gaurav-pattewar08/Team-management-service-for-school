import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { ResponseService } from 'src/common/response.service';
import { BadRequestException } from '@nestjs/common';
import { TEAM_MESSAGES } from './team.constant';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CoachVerifiedGuard } from 'src/auth/coach-verification.guard';


describe('TeamController', () => {
  let controller: TeamController;
  let service: jest.Mocked<TeamService>;

  const mockFile = {
    fieldname: 'logo',
    originalname: 'logo.png',
    encoding: '7bit',
    mimetype: 'image/png',
    buffer: Buffer.from('x'),
    size: 100,
    destination: '',
    filename: '',
    path: '',
    stream: null as any,
  } as Express.Multer.File;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [TeamController],
      providers: [
        { provide: TeamService, useValue: {
          createTeam: jest.fn(), submitTeam: jest.fn(), getAllTeams: jest.fn(), getTeamBySchoolId: jest.fn(),
        } },
        { provide: ResponseService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(CoachVerifiedGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) });

    const module: TestingModule = await builder.compile();

    controller = module.get<TeamController>(TeamController);
    service = module.get(TeamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTeam', () => {
    it('should throw when file missing', async () => {
      await expect(controller.createTeam(undefined as any, { name: 'T' } as any, { user: { coachId: 'c1' } } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw when coachId missing', async () => {
      await expect(controller.createTeam(mockFile, { name: 'T' } as any, { user: {} } as any)).rejects.toThrow(BadRequestException);
    });

    it('should call service and return response', async () => {
      service.createTeam.mockResolvedValue({ message: TEAM_MESSAGES.CREATED, team: { id: 't1' } } as any);
      const res = await controller.createTeam(mockFile, { name: 'T' } as any, { user: { coachId: 'c1' } } as any);
      expect(service.createTeam).toHaveBeenCalledWith('c1', mockFile, 'T');
      expect(res).toEqual({ message: TEAM_MESSAGES.CREATED, data: { id: 't1' } });
    });
  });

  describe('submitTeam', () => {
    it('should call service and return data', async () => {
      service.submitTeam.mockResolvedValue({ message: TEAM_MESSAGES.TEAM_SUBMITTED, team: { id: 't1' } } as any);
      const res = await controller.submitTeam({ user: { coachId: 'c1' } } as any);
      expect(service.submitTeam).toHaveBeenCalledWith('c1');
      expect(res).toEqual({ message: TEAM_MESSAGES.TEAM_SUBMITTED, data: { id: 't1' } });
    });
  });

  describe('getAllTeams', () => {
    it('should map result and return', async () => {
      service.getAllTeams.mockResolvedValue({ message: TEAM_MESSAGES.TEAMS_FETCHED, teams: [] } as any);
      const res = await controller.getAllTeams();
      expect(res).toEqual({ message: TEAM_MESSAGES.TEAMS_FETCHED, data: [] });
    });
  });

  describe('getCoachTeamPlayersBySchool', () => {
    it('should call service and return mapped response', async () => {
      const payload = { schoolName: 'S' } as any;
      service.getTeamBySchoolId.mockResolvedValue(payload);
      const res = await controller.getCoachTeamPlayersBySchool('s1');
      expect(service.getTeamBySchoolId).toHaveBeenCalledWith('s1');
      expect(res).toEqual({ message: TEAM_MESSAGES.FETCH_SUCCESS, data: payload });
    });
  });
});
