
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from 'src/common/roles.enum';
import { AUTH_ERRORS } from './auth.constants';

interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role; 
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),   
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user) {
        return false; 
    }
    
    const authenticatedUser = user as AuthenticatedUser;
    const userRole = authenticatedUser.role;

    const isRequiredRole = requiredRoles.some(
        (role) => userRole === role,
    );
     if (!isRequiredRole) {
      throw new ForbiddenException(AUTH_ERRORS.ACCESS_DENIDED);
    }
    return isRequiredRole;
  }
}