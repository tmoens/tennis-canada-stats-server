/* simple execution context to allow us to run the Match quality Reporter on a schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure } from 'log4js';
import { MatchDataExporterService } from './modules/exporters/match-data/match-data-exporter.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const service = app.get(MatchDataExporterService);

  configure('log4js_config.json');
  await service.buildMatchCompetitivenessReport();

  await delay(60000);

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
