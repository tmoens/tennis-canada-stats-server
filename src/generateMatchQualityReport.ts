/* simple execution context to allow us to run the Match quality Reporter on a schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure} from 'log4js';
import {MatchDataExporterService} from './modules/exporters/match-data/match-data-exporter.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const service = app.get(MatchDataExporterService);

  configure('log4js_config.json');
  await service.buildMatchQualityReport();

  /* Forgiveness requested.  I tired to get the seafile API
   * to wait for the upload to complete before returning. I failed.
   * If the UTR report was being generated from a
   * main.js (which never exits) - no big deal.
   *
   * But this executable DOES exit and it does so after the report
   * writer returns but before the file is actually uploaded.
   *
   * Consequently the upload gets aborted.
   *
   * So I am kludging things so that this process waits a minute before
   * returning.
   */

  await delay(60000);

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
