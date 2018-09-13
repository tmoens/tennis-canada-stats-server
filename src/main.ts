import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {configure, getLogger} from "log4js";
import {mkdirSync} from "fs";
import {LicenseService} from "./modules/vrtournaments/license/license.service";
import {VRRankingsTypeService} from "./modules/vrrankings/type/type.service";
import {TennisAssociationService} from "./modules/tennis_association/tennis_association.service";
import {ConfigurationService} from "./modules/configuration/configuration.service";


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(app.get('ConfigurationService')["envConfig"]['PORT']);

  /**
   * make a several directory, just in case it is a fresh install.
   */
  try {
    mkdirSync('./log');
  } catch (e) {
    if (e.code != 'EEXIST') {
      console.error("Could not set up log directory, error was: ", e);
      process.exit(1);
    }
  }
  try {
    mkdirSync('./uploads');
  } catch (e) {
    if (e.code != 'EEXIST') {
      console.error("Could not set up uploads directory, error was: ", e);
      process.exit(1);
    }
  }
  try {
    mkdirSync('./Reports');
  } catch (e) {
    if (e.code != 'EEXIST') {
      console.error("Could not set up Reports directory, error was: ", e);
      process.exit(1);
    }
  }

  configure("log4js_config.json");
  const logger = getLogger("main");
  logger.info("started");

  // Just in case this is a fresh start and the database is empty
  // use the following to load the (more or less) static data

  const licenseService = app.get(LicenseService);
  licenseService.loadLicenses();

  const rankingstypeService = app.get(VRRankingsTypeService);
  rankingstypeService.loadInitialRankingsTypes();

  const tennisAssociationsService = app.get(TennisAssociationService);
  tennisAssociationsService.loadTennisAssociations();

}
bootstrap();
