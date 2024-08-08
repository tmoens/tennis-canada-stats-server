/* simple execution context to allow us to runt the UTR Reporter ona schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure } from 'log4js';
import { CalendarService } from './modules/calendar-support/calendar.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const service = app.get(CalendarService);

  configure('log4js_config.json');
  await service.sync();

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();
