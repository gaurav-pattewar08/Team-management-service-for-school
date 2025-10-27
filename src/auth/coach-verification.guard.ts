import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CoachService } from 'src/coach/coach.service';
import { Role } from 'src/common/roles.enum';
import { AUTH_ERRORS } from './auth.constants';

@Injectable()
export class CoachVerifiedGuard implements CanActivate {
  constructor(
    private readonly coachService: CoachService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && user.role === Role.COACH) {
      const coach = await this.coachService.findByUserId(user.userId);
      if (!coach || !coach.isVerified) {
        throw new ForbiddenException(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
      }
    }
    return true;
  }
}
