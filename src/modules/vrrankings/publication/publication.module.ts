import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VRRankingsPublicationService } from './publication.service';
import { VRRankingsPublicationController } from './publication.controller';
import { VRRankingsPublication } from './publication.entity';
import { VRAPIModule } from '../../VRAPI/vrapi.module';
import { VRRankingsCategoryModule } from '../category/category.module';
import { VRRankingsItemModule } from '../item/item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VRRankingsPublication]),
    VRAPIModule,
    VRRankingsCategoryModule,
    VRRankingsItemModule,
  ],
  providers: [VRRankingsPublicationService],
  controllers: [VRRankingsPublicationController],
  exports: [VRRankingsPublicationService],
})
export class VRRankingsPublicationModule {}
