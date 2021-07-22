import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigurationService implements TypeOrmOptionsFactory {
  private readonly envConfig: EnvConfig;
  private environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV;

    if (null == this.environment) {
      this.environment = 'production';
    }

    const filePath = `environments/${this.environment}.env`;
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({

      PORT: Joi.number().default(3002),
      MYSQL_PORT: Joi.number().default(3306),

      DB_NAME: Joi.string().required(),
      DB_USER: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),

      SEAFILE_URL: Joi.string().required(),
      SEAFILE_ID: Joi.string().required(),
      SEAFILE_PASSWORD: Joi.string().required(),
      SEAFILE_REPO_NAME: Joi.string().required(),

      TYPEORM_SYNCH_DATABASE: Joi.boolean().default(false),
      TYPEORM_LOG_QUERIES: Joi.boolean().default(false),

      VRAPI_USER: Joi.string().required(),
      VRAPI_PASSWORD: Joi.string().required(),

      ITFAPI_URL: Joi.string().required(),
      ITFAPI_USER: Joi.string().required(),
      ITFAPI_PASSWORD: Joi.string().required(),
      ITF_LOADER_PERIOD: Joi.number().required(),

      TOURNAMENT_UPLOAD_START_YEAR: Joi.number().default(0),
      TOURNAMENT_UPLOAD_LIMIT: Joi.number().default(10),

      RANKING_PUBLICATION_UPLOAD_LIMIT: Joi.number().default(10),

      UTR_REPORT_GOES_BACK_IN_DAYS: Joi.number().required(),

      HOW_MANY_CANDIDATE_MATCHES: Joi.number().default(3),
      CANDIDATE_MATCH_SCORE_THRESHOLD: Joi.number().default(-1),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(
      envConfig
    );
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get vrapiUser(): string {
    return this.envConfig.VRAPI_USER;
  }

  get vrapiPassword(): string {
    return this.envConfig.VRAPI_PASSWORD;
  }

  get itfapiURL(): string {
    return this.envConfig.ITFAPI_URL;
  }

  get itfapiUser(): string {
    return this.envConfig.ITFAPI_USER;
  }

  get itfapiPassword(): string {
    return this.envConfig.ITFAPI_PASSWORD;
  }

  get itfLoaderPeriod(): number {
    return Number(this.envConfig.ITF_LOADER_PERIOD);
  }

  get tournamentUploadStartYear(): number {
    /* If there is an explicit start year configured, use it.
     * otherwise:
     * if it now before May (month 4), load this year and last.
     * if it is May or later, just load this year.
     */
    if (Number(this.envConfig.TOURNAMENT_UPLOAD_START_YEAR) > 2012) {
      return Number(this.envConfig.TOURNAMENT_UPLOAD_START_YEAR);
    }
    const d = new Date();
    if (d.getMonth() > 4) {
      return d.getFullYear();
    } else {
      return d.getFullYear() - 1;
    }
  }

  get tournamentUploadLimit(): number {
    return Number(this.envConfig.TOURNAMENT_UPLOAD_LIMIT);
  }

  get rankingUploadLimit(): number {
    return Number(this.envConfig.RANKING_PUBLICATION_UPLOAD_LIMIT);
  }

  get utrReportGoesBackInDays(): number {
    return Number(this.envConfig.UTR_REPORT_GOES_BACK_IN_DAYS);
  }

  // The seafile configuration is used to upload files to a server for UTR.
  get seafileURL(): string {
    return this.envConfig.SEAFILE_URL;
  }

  get seafileUserId(): string {
    return this.envConfig.SEAFILE_ID;
  }

  get seafilePassword(): string {
    return this.envConfig.SEAFILE_PASSWORD;
  }

  get seafileRepoName(): string {
    return this.envConfig.SEAFILE_REPO_NAME;
  }

  get typeORMLogQueries(): boolean {
    return Boolean(this.envConfig.TYPEORM_LOG_QUERIES);
  }

  get typeORMSyncDatabase(): boolean {
    return Boolean(this.envConfig.TYPEORM_SYNCH_DATABASE);
  }

  get howManyCandidateMatches(): number {
    return Number(this.envConfig.HOW_MANY_CANDIDATE_MATCHES);
  }

  get candidateMatchScoreThreshold(): number {
    return Number(this.envConfig.CANDIDATE_MATCH_SCORE_THRESHOLD);
  }

  get mysqlPort(): number {
    return Number(this.envConfig.MYSQL_PORT);
  }

  // This is used to build ORM configuration options
  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const SOURCE_PATH = this.environment === 'production' ? 'dist' : 'src';
    console.log ('Hey wait' + this.mysqlPort);
    const logOptions: string[] = ['error'];
    if (this.typeORMLogQueries) {
      return {
        type: 'mysql',
        host: 'localhost',
        port: this.mysqlPort,
        username: this.envConfig.DB_USER,
        password: this.envConfig.DB_PASSWORD,
        database: this.envConfig.DB_NAME,
        entities: [
          `${SOURCE_PATH}/**/*.entity{.ts,.js}`,
        ],
        synchronize: this.typeORMSyncDatabase,
        logging: ['error', 'query'],
      };
    } else {
      return {
        type: 'mysql',
        host: 'localhost',
        port: this.mysqlPort,
        username: this.envConfig.DB_USER,
        password: this.envConfig.DB_PASSWORD,
        database: this.envConfig.DB_NAME,
        entities: [
          `${SOURCE_PATH}/**/*.entity{.ts,.js}`,
        ],
        synchronize: this.typeORMSyncDatabase,
        logging: ['error'],
      };

    }
  }
}
