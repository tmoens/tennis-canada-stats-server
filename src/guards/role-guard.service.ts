import {CanActivate, ExecutionContext, Injectable} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {User} from '../modules/user/user.entity';
import {Roles} from '../modules/auth/roles';
import {getLogger, Logger} from 'log4js';

const logger: Logger = getLogger('RoleGuard')
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {
  }

  canActivate(context: ExecutionContext): boolean {
    const permittedRole = this.reflector.get<string>('role', context.getHandler());
    if (!permittedRole) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (Roles.isAuthorized(user.role, permittedRole)) {
      return true;
    } else {
      logger.warn(`User: ${user.id} with role: ${user.role} attempted requested: ${JSON.stringify(request, null, 2)}`)
    }
  }
}
