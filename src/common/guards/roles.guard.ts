import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Ensure user exists and has roles
    if (!user || !user.roles) {
      return false;
    }

    // Check if user has any of the required roles
    return requiredRoles.some((role) => 
      user.roles.map(r => r.name).includes(role)
    );
  }
}