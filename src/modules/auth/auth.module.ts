import { Module } from '@nestjs/common';
import { ConfigurationModule } from '../configuration/configuration.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigurationService } from '../configuration/configuration.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigurationModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      useExisting: ConfigurationService,
      // useFactory: (configService: ConfigurationService) => ({
      //   secret: configService.jwtSecret,
      //   signOptions: { expiresIn: configService.jwtDuration },
      // }),
      // inject: [ConfigurationService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
