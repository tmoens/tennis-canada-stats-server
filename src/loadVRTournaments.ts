/* simple execution context to allow us to load VR tournaments on any kind of schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure, getLogger} from 'log4js';
import {TournamentService} from './modules/vrtournaments/tournament/tournament.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configure('log4js_config.json');
  const logger = getLogger('vrimport');
  logger.info('**** Tournament Loader started.');

  const tournamentService = app.get(TournamentService);
  await tournamentService.importTournamentsFromVR();

  logger.info('**** Tournament Loader done.');

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();
