import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigurationService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
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
      TOURNAMENT_UPLOAD_LIMIT: Joi.number().default(-1),

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


}