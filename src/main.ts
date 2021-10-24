import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure, getLogger} from 'log4js';
import {mkdirSync} from 'fs';
import {ConfigurationService} from './modules/configuration/configuration.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const configService: ConfigurationService = await app.get(ConfigurationService);

  /**
   * make several directories, just in case it is a fresh install.
   */
  try {
    mkdirSync('./log');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      process.exit(1);
    }
  }
  try {
    mkdirSync('./uploads');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      process.exit(1);
    }
  }
  try {
    mkdirSync('./Reports');
  } catch (e) {
    if (e.code !== 'EEXIST') {
      process.exit(1);
    }
  }

  configure('log4js_config.json');
  const logger = getLogger('main');
  logger.info('Started.  Listening on port: ' + configService.port + '.');

  await app.listen(configService.port);
}
bootstrap();
