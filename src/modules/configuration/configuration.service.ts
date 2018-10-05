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

    const filePath = `environments/${this.environment}.env`
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
      DB_NAME: Joi.string().required(),
      DB_USER: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),
      VRAPI_USER: Joi.string().required(),
      VRAPI_PASSWORD: Joi.string().required(),

      TOURNAMENT_UPLOAD_START_YEAR: Joi.number().default(2013),
      TOURNAMENT_UPLOAD_LIMIT: Joi.number().default(10),

      RANKING_PUBLICATION_UPLOAD_LIMIT: Joi.number().default(10),

      TYPEORM_SYNCH_DATABASE: Joi.boolean().default(false),

    });

    const { error, value: validatedEnvConfig } = Joi.validate(
      envConfig,
      envVarsSchema,
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

  get tournamentUploadStartYear(): number {
    return Number(this.envConfig.TOURNAMENT_UPLOAD_START_YEAR);
  }

  get tournamentUploadLimit(): number {
    return Number(this.envConfig.TOURNAMENT_UPLOAD_LIMIT);
  }

  get rankingUploadLimit(): number {
    return Number(this.envConfig.RANKING_PUBLICATION_UPLOAD_LIMIT);
  }

  createTypeOrmOptions(): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const SOURCE_PATH = this.environment === 'production' ? 'dist' : 'src';

    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: this.envConfig.DB_USER,
      password: this.envConfig.DB_PASSWORD,
      database: this.envConfig.DB_NAME,
      entities: [
        `${SOURCE_PATH}/**/*.entity{.ts,.js}`,
      ],
      synchronize: false,
      logging: ['error'],
    };
  }
}