import {Strategy} from 'passport-local';
import {PassportStrategy} from '@nestjs/passport';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {UserService} from '../modules/user/user.service';
import {getLogger, Logger} from 'log4js';

const logger: Logger = getLogger('LocalStrategy');
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private userService: UserService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    const user = await this.userService.validateUserByPassword(username, password);
    if (!user) {
      const message = 'Invalid username and password combination.';
      logger.warn(message)
      throw new UnauthorizedException(message);
    }

    if (!user.isActive) {
      const message = 'User is not active.';
      logger.warn(message)
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
