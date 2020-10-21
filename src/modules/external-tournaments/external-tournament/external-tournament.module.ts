import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ExternalTournament} from './external-tournament.entity';
import {ExternalTournamentService} from './external-tournament.service';
import {ExternalTournamentController} from './external-tournament.controller';
import {ExternalEventModule} from '../external-event/external-event.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalTournament]),
    ExternalEventModule,
  ],
  providers: [
    ExternalTournamentService,
  ],
  controllers: [
    ExternalTournamentController,
  ],
  exports: [
    TypeOrmModule,
    ExternalTournamentService,
  ],
})
export class ExternalTournamentModule {}
