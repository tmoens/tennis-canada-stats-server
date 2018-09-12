import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VRRankingsCategoryService } from './category.service';
import { VRRankingsCategoryController } from './category.controller';
import { VRRankingsCategory } from './category.entity';
import {VRAPIModule} from "../../VRAPI/vrapi.module";
import {VRRankingsItemModule} from "../item/item.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([VRRankingsCategory]),
    VRAPIModule,
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
