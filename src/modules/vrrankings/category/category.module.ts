import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VRRankingsCategoryService } from './category.service';
import { VRRankingsCategoryController } from './category.controller';
import { VRRankingsCategory } from './category.entity';
import {VRAPIModule} from "../../VRAPI/vrapi.module";
import {StatsModule} from "../../stats/stats.module";
import {VRRankingsItemModule} from "../item/item.module";
import {VRRankingsTypeModule} from "../type/type.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([VRRankingsCategory]),
    VRAPIModule,
    StatsModule,
    VRRankingsItemModule,
  ],
  providers: [
    VRRankingsCategoryService
  ],
  controllers: [
    VRRankingsCategoryController
  ],
  exports:[
    VRRankingsCategoryService
  ],
})
export class VRRankingsCategoryModule {}
