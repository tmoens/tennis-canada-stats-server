/* simple execution context to allow us to load VR tournaments on any kind of schedule */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { VRRankingsTypeService } from './modules/vrrankings/type/type.service';
import { configure } from 'log4js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const rankingService = app.get(VRRankingsTypeService);

  configure('log4js_config.json');
  await rankingService.importVRRankingsFromVR();

  /* This is not a persistent service, so let's exit */
  process.exit();
}
bootstrap();
