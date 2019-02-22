import { Module } from '@nestjs/common';
import { ExternalEventResultService } from './external-event-result.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ExternalEventResultController} from './external-event-result.controller';
import {ExternalEventResult} from './external-event-result.entity';
import {PointExchangeModule} from '../point-exchange/point-exchange.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalEventResult]),
    PointExchangeModule,
  ],
  providers: [
    ExternalEventResultService,
  ],
  controllers: [
    ExternalEventResultController,
  ],
  exports: [
    ExternalEventResultService,
  ],

})
export class ExternalEventResultModule {}
