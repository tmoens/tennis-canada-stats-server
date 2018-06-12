import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { License } from './license.entity';
import {StatsModule} from "../../stats/stats.module";
import {TournamentModule} from "../tournament/tournament.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([License]),
    StatsModule,
  ],
  providers: [
    LicenseService,
  ],
  controllers: [
    LicenseController
  ],
  exports: [LicenseService]
})
export class LicenseModule {}