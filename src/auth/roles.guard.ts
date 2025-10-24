// src/auth/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { Role } from 'src/common/roles.enum';

interface AuthenticatedUser {
  userId: number;
  email: string;
  role: Role; 
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get the required roles metadata
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),   
    ]);

    // If no roles are defined, access is granted.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Get the authenticated user
    const { user } = context.switchToHttp().getRequest();
    
    // Check if the user object exists (AuthGuard should ensure this)
    if (!user) {
        return false; 
    }
    
    const authenticatedUser = user as AuthenticatedUser;
    console.log('Authenticated User Role:', authenticatedUser.role);
    const userRole = authenticatedUser.role;

    const isRequiredRole = requiredRoles.some(
        (role) => userRole === role,
    );
     if (!isRequiredRole) {
      throw new ForbiddenException(`Access denied`);
    }
    console.log(isRequiredRole)
    return isRequiredRole;
  }
}