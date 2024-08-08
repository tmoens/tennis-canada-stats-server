import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VRRankingsTypeService } from './type.service';
import { VRRankingsTypeController } from './type.controller';
import { VRRankingsType } from './type.entity';
import { VRAPIModule } from '../../VRAPI/vrapi.module';
import { VRRankingsPublicationModule } from '../publication/publication.module';
import { VRRankingsCategoryModule } from '../category/category.module';

// VR does four types of rankings for Tennis Canada: Adult, Junior, Senior and Wheelchair
// Each has several categories, see VRRankingsCategory

@Module({
  imports: [
    TypeOrmModule.forFeature([VRRankingsType]),
    VRAPIModule,
    VRRankingsPublicationModule,
    VRRankingsCategoryModule,
  ],
  providers: [VRRankingsTypeService],
  controllers: [VRRankingsTypeController],
  exports: [VRRankingsTypeService],
})
export class VRRankingsTypeModule {}
