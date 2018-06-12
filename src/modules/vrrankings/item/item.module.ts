import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VRRankingsItemService } from './item.service';
import { VRRankingsItemController } from './item.controller';
import { VRRankingsItem } from './item.entity';
import {VRAPIModule} from "../../VRAPI/vrapi.module";
import {StatsModule} from "../../stats/stats.module";
import {PlayerModule} from "../../player/player.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([VRRankingsItem]),
    VRAPIModule,
    StatsModule,
    forwardRef(() => PlayerModule),
  ],
  providers: [
    VRRankingsItemService
  ],
  controllers: [
    VRRankingsItemController
  ],
  exports:[
    VRRankingsItemService
  ],
})
export class VRRankingsItemModule {}
