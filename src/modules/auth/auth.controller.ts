import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../../guards/local-auth.guard';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequestWithUser } from '../../guards/request-with-user';

// Remember that the JwtAuthGuard handles the Request adds the validated user to it.

@UseInterceptors(ClassSerializerInterceptor)
@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  // This is the only endpoint that uses the LocalAuthGuard (i.e. password change)
  // Remember that the LocalAuthGuard handles the Request adds the validated user to it.
  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  async login(@Request() req: RequestWithUser) {
    return { access_token: this.authService.login(req.user) };
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth/logout')
  async logout(@Request() req: RequestWithUser) {
    return this.authService.logout(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }
}
