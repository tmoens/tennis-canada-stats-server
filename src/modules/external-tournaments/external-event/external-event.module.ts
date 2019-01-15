import { Module } from '@nestjs/common';
import { ExternalEventController } from './external-event.controller';
import { ExternalEventService } from './external-event.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ExternalEvent} from './external-event.entity';
import {EventRatingModule} from '../event-rating/event-rating.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalEvent]),
    EventRatingModule,
  ],
  providers: [
    ExternalEventService,
  ],
  controllers: [
    ExternalEventController,
  ],
  exports: [
    ExternalEventService,
  ],
})

export class ExternalEventModule {}
