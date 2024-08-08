import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarTournament } from './calendar-tournament.entity';
import { CalendarEvent } from './calendar-event.entity';
import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { TournamentModule } from '../vrtournaments/tournament/tournament.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent, CalendarTournament], 'calendar'),
    TournamentModule,
  ],
  providers: [CalendarService],
  controllers: [],
  exports: [TypeOrmModule, CalendarService],
})
export class CalendarModule {}
