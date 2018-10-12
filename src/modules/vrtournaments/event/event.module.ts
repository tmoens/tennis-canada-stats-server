import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './event.entity';
import {VRAPIModule} from '../../VRAPI/vrapi.module';
import {DrawModule} from '../draw/draw.module';
import {PlayerModule} from '../../player/player.module';
import {Module} from '@nestjs/common';
import {VRRankingsCategoryModule} from '../../vrrankings/category/category.module';
import {VRRankingsPublicationModule} from '../../vrrankings/publication/publication.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    VRAPIModule,
    DrawModule,
    PlayerModule,
    VRRankingsCategoryModule,
    VRRankingsPublicationModule,
  ],
  providers: [
    EventService,
  ],
  controllers: [
    EventController,
  ],
  exports: [EventService],
})
export class EventModule {}