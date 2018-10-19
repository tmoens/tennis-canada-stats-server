/* simple execution context to allow us to runt the UTR Reporter ona schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure} from 'log4js';
import {UtrService} from './modules/reporters/UTRReports/utr.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const service = app.get(UtrService);

  configure('log4js_config.json');
  await service.buildUTRReport();



  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();

