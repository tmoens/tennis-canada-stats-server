/* simple execution context to allow us to load VR tournaments on any kind of schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure, getLogger} from 'log4js';
import {TournamentService} from './modules/vrtournaments/tournament/tournament.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const tournamentService = app.get(TournamentService);
  await tournamentService.importTournamentsFromVR();

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();
