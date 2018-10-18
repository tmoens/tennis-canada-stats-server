import { Module} from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtrService } from './utr.service';
import { UtrController } from './utr.controller';
import {VRAPIModule} from '../../VRAPI/vrapi.module';
import {SeafileModule} from '../../Seafile/seafile.module';
import {Tournament} from '../../vrtournaments/tournament/tournament.entity';
import {EventModule} from '../../vrtournaments/event/event.module';
import {LicenseModule} from '../../vrtournaments/license/license.module';

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
    UtrService,
  ],
  controllers: [
    UtrController,
  ],
  exports: [
    UtrService,
  ],
})
export class UtrModule {}