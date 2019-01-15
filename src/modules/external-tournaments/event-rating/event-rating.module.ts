import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRatingController } from './event-rating.controller';
import {EventRatingService} from './event-rating.service';
import {EventRating} from './event-rating.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventRating]),
  ],
  providers: [
    EventRatingService,
  ],
  controllers: [
    EventRatingController,
  ],
  exports: [
    EventRatingService,
  ],
})

export class EventRatingModule {}
