import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CoachService } from 'src/coach/coach.service';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/common/roles.enum';
import { AUTH_ERRORS } from './auth.constants';
import { CoachVerifiedGuard } from './coach-verification.guard';

describe('CoachVerifiedGuard', () => {
  let guard: CoachVerifiedGuard;
  let coachService: jest.Mocked<CoachService>;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoachVerifiedGuard,
        { provide: CoachService, useValue: { findByUserId: jest.fn() } },
        Reflector,
      ],
    }).compile();

    guard = module.get(CoachVerifiedGuard);
    coachService = module.get(CoachService);
    reflector = module.get(Reflector);
  });

  const mockExecutionContext = (user: any): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext);

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow if user is not a coach (e.g., admin)', async () => {
    const context = mockExecutionContext({ role: Role.ADMIN });
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should allow if coach exists and is verified', async () => {
    const user = { role: Role.COACH, userId: 'coach1' };
    coachService.findByUserId.mockResolvedValue({ id: 'c1', isVerified: true } as any);
    const context = mockExecutionContext(user);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(coachService.findByUserId).toHaveBeenCalledWith('coach1');
  });

  it('should throw ForbiddenException if coach not found', async () => {
    const user = { role: Role.COACH, userId: 'coach2' };
    coachService.findByUserId.mockResolvedValue(null);
    const context = mockExecutionContext(user);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(AUTH_ERRORS.EMAIL_NOT_VERIFIED),
    );
  });

  it('should throw ForbiddenException if coach is not verified', async () => {
    const user = { role: Role.COACH, userId: 'coach3' };
    coachService.findByUserId.mockResolvedValue({ id: 'c3', isVerified: false } as any);
    const context = mockExecutionContext(user);
    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(AUTH_ERRORS.EMAIL_NOT_VERIFIED),
    );
  });

  it('should allow if user is undefined', async () => {
    const context = mockExecutionContext(undefined);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
