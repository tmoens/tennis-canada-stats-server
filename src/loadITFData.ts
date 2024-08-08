/* simple execution context to allow us to load ITF Data on any kind of schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure } from 'log4js';
import { ItfapiService } from './modules/ITFAPI/itfapi.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const itfAPIService = app.get(ItfapiService);

  configure('log4js_config.json');
  await itfAPIService.loadResults();

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();
