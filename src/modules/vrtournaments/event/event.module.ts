import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './event.entity';
import { VRAPIModule } from '../../VRAPI/vrapi.module';
import { DrawModule } from '../draw/draw.module';
import { PlayerModule } from '../../player/player.module';
import { Module } from '@nestjs/common';
import { VRRankingsCategoryModule } from '../../vrrankings/category/category.module';
import { VRRankingsPublicationModule } from '../../vrrankings/publication/publication.module';
import { EventPlayerModule } from '../event_player/event_player.module';
import { VRRankingsItemModule } from '../../vrrankings/item/item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]),
    VRAPIModule,
    DrawModule,
    EventPlayerModule,
    PlayerModule,
    VRRankingsCategoryModule,
    VRRankingsPublicationModule,
    VRRankingsItemModule,
  ],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService],
})
export class EventModule {}
