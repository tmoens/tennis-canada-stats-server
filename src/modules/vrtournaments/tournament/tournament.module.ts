import { Module} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { Tournament } from './tournament.entity';
import {VRAPIModule} from '../../VRAPI/vrapi.module';
import {EventModule} from '../event/event.module';
import {LicenseModule} from '../license/license.module';
import {SeafileModule} from '../../Seafile/seafile.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament]),
    PassportModule,
    VRAPIModule,
    SeafileModule,
    EventModule,
    LicenseModule,
  ],
  providers: [
    TournamentService,
  ],
  controllers: [
    TournamentController,
  ],
  exports: [
    TournamentService,
  ],
})
export class TournamentModule {}