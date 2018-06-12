import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { Tournament } from './tournament.entity';
import {VRAPIModule} from "../../VRAPI/vrapi.module";
import {StatsModule} from "../../stats/stats.module";
import {EventModule} from "../event/event.module";
import {LicenseModule} from "../license/license.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament]),
    VRAPIModule,
    StatsModule,
    EventModule,
    LicenseModule,
  ],
  providers: [
    TournamentService
  ],
  controllers: [
    TournamentController
  ],
  exports:[
    TournamentService
  ],
})
export class TournamentModule {}