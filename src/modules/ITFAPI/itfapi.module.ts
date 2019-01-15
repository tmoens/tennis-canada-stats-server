import { Module } from '@nestjs/common';
import {HttpModule} from '@nestjs/common/http';
import {ItfapiService} from './itfapi.service';
import {ItfapiController} from './itfapi.controller';
import {ExternalTournamentModule} from '../external-tournaments/external-tournament/external-tournament.module';
import {ExternalPlayerModule} from '../external-tournaments/external-player/external-player.module';
import {ExternalEventModule} from '../external-tournaments/external-event/external-event.module';
import {EventRatingModule} from '../external-tournaments/event-rating/event-rating.module';
import {ExternalEventResultModule} from '../external-tournaments/external-event-result/external-event-result.module';
import {ItfMatchResultsModule} from '../external-tournaments/itf-match-results/itf-match-results.module';

@Module({
  providers: [
    ItfapiService,
  ],
  imports: [
    HttpModule,
    EventRatingModule,
    ExternalEventModule,
    ExternalEventResultModule,
    ExternalPlayerModule,
    ExternalTournamentModule,
    ItfMatchResultsModule,
  ],
  controllers: [
    ItfapiController,
  ],
  exports: [
    ItfapiService,
  ],
})
export class ITFAPIModule {}
