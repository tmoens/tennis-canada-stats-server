import {Module} from '@nestjs/common';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {User} from './user.entity';
import {UserRepository} from './user.repository';
import {JwtModule} from '@nestjs/jwt';
import {ConfigurationModule} from '../configuration/configuration.module';
import {ConfigurationService} from '../configuration/configuration.service';
import {TCMailerService} from '../mailer/mailer-service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserRepository]),
    JwtModule.registerAsync({
      imports: [ConfigurationModule],
      useFactory: (configService: ConfigurationService) => ({
        secret: configService.jwtSecret,
        signOptions: {expiresIn: configService.jwtDuration},
      }),
      inject: [ConfigurationService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService, TCMailerService],
  exports: [
    TypeOrmModule,
    UserService,
  ],
})
export class UserModule {}
