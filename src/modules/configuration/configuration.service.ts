import * as dotenv from 'dotenv';
import * as Joi from 'joi';
import * as fs from 'fs';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { LoggerOptions } from 'typeorm/logger/LoggerOptions';
import { MailerOptions, MailerOptionsFactory } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtModuleOptions, JwtOptionsFactory } from '@nestjs/jwt';
import { VRRankingsItem } from '../vrrankings/item/item.entity';
import { VRRankingsCategory } from '../vrrankings/category/category.entity';
import { ExternalEventResult } from '../external-tournaments/external-event-result/external-event-result.entity';
import { ExternalEvent } from '../external-tournaments/external-event/external-event.entity';
import { ExternalPlayer } from '../external-tournaments/external-player/external-player.entity';
import { ExternalTournament } from '../external-tournaments/external-tournament/external-tournament.entity';
import { ItfMatchResult } from '../external-tournaments/itf-match-results/itf-match-result.entity';
import { VRRankingsPublication } from '../vrrankings/publication/publication.entity';
import { VRRankingsType } from '../vrrankings/type/type.entity';
import { Draw } from '../vrtournaments/draw/draw.entity';
import { Event } from '../vrtournaments/event/event.entity';
import { User } from '../user/user.entity';
import { EventPlayer } from '../vrtournaments/event_player/event_player.entity';
import { License } from '../vrtournaments/license/license.entity';
import { MatchPlayer } from '../vrtournaments/match_player/match_player.entity';
import { Player } from '../player/player.entity';
import { Match } from '../vrtournaments/match/match.entity';
import { PointExchange } from '../external-tournaments/point-exchange/point-exchange.entity';
import { TennisAssociation } from '../tennis_association/tennis_association.entity';
import { Tournament } from '../vrtournaments/tournament/tournament.entity';
import { CalendarEvent } from '../calendar-support/calendar-event.entity';
import { CalendarTournament } from '../calendar-support/calendar-tournament.entity';
import { TournamentGradeApproval } from '../tournament-grade-approval/tournament-grade-approval.entity';

export const TC_STATS_DB = 'tc_stats';
export const CALENDAR_DB = 'calendar_db';

export interface EnvConfig {
  [prop: string]: string;
}

export class ConfigurationService
  implements MailerOptionsFactory, JwtOptionsFactory, TypeOrmOptionsFactory
{
  private readonly envConfig: EnvConfig;
  readonly environment: string;

  constructor() {
    this.environment = process.env.NODE_ENV;

    if (null == this.environment) {
      this.environment = 'production';
    }

    const filePath = `environments/${this.environment}.env`;
    if (!fs.existsSync(filePath)) {
      throw new Error(`NODE_ENV is set to ${this.environment}, but
      the expected configuration file was not found at ${filePath}`);
    }

    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = ConfigurationService.validateInput(config);
  }

  get port(): number {
    return Number(this.envConfig.PORT);
  }

  // This is so the system can set up a default admin user
  get defaultAdminUserName(): string {
    return this.envConfig.DEFAULT_ADMIN_USER_NAME;
  }

  get defaultAdminUserEmail(): string {
    return this.envConfig.DEFAULT_ADMIN_USER_EMAIL;
  }

  get defaultAdminUserPassword(): string {
    return this.envConfig.DEFAULT_ADMIN_USER_PASSWORD;
  }

  get jwtSecret(): string {
    return this.envConfig.JWT_SECRET;
  }

  get jwtDuration(): string {
    return this.envConfig.JWT_DURATION;
  }

  /**
   * Ensures all needed variables are set, and returns the validated JavaScript object
   * including the applied default values.
   */
  private static validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      PORT: Joi.number().default(3002),
      MYSQL_PORT: Joi.number().default(3306),

      DB_NAME: Joi.string().required(),
      DB_USER: Joi.string().required(),
      DB_PASSWORD: Joi.string().required(),

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
      BOX_LADDER_FORCE_RELOAD_PERCENT: Joi.number().default(0),

      RANKING_PUBLICATION_UPLOAD_LIMIT: Joi.number().default(10),

      UTR_REPORT_DIRECTORY: Joi.string().required(),
      UTR_REPORT_GOES_BACK_IN_DAYS: Joi.number().required(),

      MATCH_COMPETITIVENESS_REPORT_DIRECTORY: Joi.string().required(),

      CALENDAR_DB_SYNC_PERIOD: Joi.number().default(5),

      HOW_MANY_CANDIDATE_MATCHES: Joi.number().default(3),
      CANDIDATE_MATCH_SCORE_THRESHOLD: Joi.number().default(-1),

      JWT_SECRET: Joi.string().required(),
      JWT_DURATION: Joi.string().required(),

      MAIL_FROM: Joi.string().required(),
      MAIL_REPLY_TO: Joi.string().required(),
      MAIL_CC: Joi.string().required(),
      MAIL_HOST: Joi.string().required(),
      MAIL_USER: Joi.string().required(),
      MAIL_PASSWORD: Joi.string().required(),

      DEFAULT_ADMIN_USER_NAME: Joi.string().required(),
      DEFAULT_ADMIN_USER_EMAIL: Joi.string().required(),
      DEFAULT_ADMIN_USER_PASSWORD: Joi.string().required(),
    });

    const { error, value: validatedEnvConfig } =
      envVarsSchema.validate(envConfig);
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

  get boxLadderForceReloadPercent(): number {
    return Number(this.envConfig.BOX_LADDER_FORCE_RELOAD_PERCENT);
  }

  get rankingUploadLimit(): number {
    return Number(this.envConfig.RANKING_PUBLICATION_UPLOAD_LIMIT);
  }

  get utrReportGoesBackInDays(): number {
    return Number(this.envConfig.UTR_REPORT_GOES_BACK_IN_DAYS);
  }

  get utrReportDirectory(): string {
    return String(this.envConfig.UTR_REPORT_DIRECTORY);
  }

  get matchCompetitivenessReportDirectory(): string {
    return String(this.envConfig.MATCH_COMPETITIVENESS_REPORT_DIRECTORY);
  }

  get calendarDbSyncPeriod(): number {
    return Number(this.envConfig.CALENDAR_DB_SYNC_PERIOD);
  }

  get typeORMLogQueries(): boolean {
    return Boolean(this.envConfig.TYPEORM_LOG_QUERIES);
  }

  get typeORMSyncDatabase(): boolean {
    return Boolean(this.envConfig.TYPEORM_SYNCH_DATABASE);
  }

  get mysqlPort(): number {
    return Number(this.envConfig.MYSQL_PORT);
  }

  // This is used to build ORM configuration options
  createTypeOrmOptions(
    db: string,
  ): Promise<TypeOrmModuleOptions> | TypeOrmModuleOptions {
    const tcStatsEntities = [
      Draw,
      Event,
      EventPlayer,
      ExternalEvent,
      ExternalEventResult,
      ExternalPlayer,
      ExternalTournament,
      ItfMatchResult,
      License,
      Match,
      MatchPlayer,
      Player,
      PointExchange,
      TennisAssociation,
      Tournament,
      User,
      VRRankingsCategory,
      VRRankingsItem,
      VRRankingsPublication,
      VRRankingsType,
      TournamentGradeApproval,
    ];
    const calendarEntities = [CalendarEvent, CalendarTournament];
    const logOptions: LoggerOptions = ['error'];
    if (this.typeORMLogQueries) {
      logOptions.push('query');
    }
    const defaultOptions: TypeOrmModuleOptions = {
      type: 'mysql',
      host: 'localhost',
      port: this.mysqlPort,
      username: this.envConfig.DB_USER,
      password: this.envConfig.DB_PASSWORD,
      synchronize: this.typeORMSyncDatabase,
      logging: logOptions,
      charset: 'utf8mb4',
    };
    switch (db) {
      case TC_STATS_DB:
        return {
          ...defaultOptions,
          database: this.envConfig.DB_NAME,
          entities: tcStatsEntities,
        };
      case CALENDAR_DB:
        return {
          ...defaultOptions,
          database: 'vrtournaments',
          entities: calendarEntities,
        };
      default:
        throw new Error(
          `Cannot generate TypeORM options for unknown database: ${db}.`,
        );
    }
  }
  // entities: [`${SOURCE_PATH}/**/*.entity{.ts,.js}`],

  // For more information and options read https://nodemailer.com
  createMailerOptions(): Promise<MailerOptions> | MailerOptions {
    return {
      defaults: {
        from: this.envConfig.MAIL_FROM,
        replyTo: this.envConfig.MAIL_REPLY_TO,
        cc: this.envConfig.MAIL_CC,
      },
      transport: {
        host: this.envConfig.MAIL_HOST,
        port: 587,
        secure: false, // the session will use STARTTLS
        auth: {
          user: this.envConfig.MAIL_USER,
          pass: this.envConfig.MAIL_PASSWORD,
        },
      },
      template: {
        dir: __dirname + '/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }

  createJwtOptions(): Promise<JwtModuleOptions> | JwtModuleOptions {
    return {
      secret: this.jwtSecret,
      signOptions: { expiresIn: this.jwtDuration },
    };
  }
}
