import { Module} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchDataExporterService } from './match-data-exporter.service';
import { MatchDataExporterController } from './match-data-exporter.controller';
import {VRAPIModule} from '../../VRAPI/vrapi.module';
import {Tournament} from '../../vrtournaments/tournament/tournament.entity';
import {EventModule} from '../../vrtournaments/event/event.module';
import {LicenseModule} from '../../vrtournaments/license/license.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament]),
    PassportModule,
    VRAPIModule,
    EventModule,
    LicenseModule,
  ],
  providers: [
    MatchDataExporterService,
  ],
  controllers: [
    MatchDataExporterController,
  ],
  exports: [
    MatchDataExporterService,
  ],
})
export class MatchDataExporterModule {}
