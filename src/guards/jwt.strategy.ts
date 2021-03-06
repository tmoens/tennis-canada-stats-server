import {ExtractJwt, Strategy} from 'passport-jwt';
import {PassportStrategy} from '@nestjs/passport';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {ConfigurationService} from '../modules/configuration/configuration.service';
import {AuthService} from '../modules/auth/auth.service';
import {UserService} from '../modules/user/user.service';
import {getLogger, Logger} from 'log4js';

const logger: Logger = getLogger('JwtStrategy')

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigurationService,
    private authService: AuthService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwtSecret,
    });
  }

  async validate(payload: any) {
    // At this point, the token itself and the expiry have already been checked by Passport.
    // However, the user may have logged out or been deactivated.

    const user = await this.userService.findActiveUser(payload.sub);
    if (!user) {
      const message = 'Bad Token: token does not identify an active user.'
      logger.warn(message)
      throw new UnauthorizedException(message);
    }

    if (user.passwordChangeRequired) {
      const message = 'Password change required.'
      logger.warn(message)
      throw new UnauthorizedException(message);
    }

    if (!user.isLoggedIn) {
      const message = 'Bad Token: Token does not identify a logged in user.'
      logger.warn(message)
      throw new UnauthorizedException(message);
    }

    // passport will stick the user in the request object for us.
    return user;
  }
}
