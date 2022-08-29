import {Module} from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {PassportModule} from '@nestjs/passport';
import {JwtStrategy} from './guards/jwt.strategy';
import {JwtStrategy2} from './guards/jwt.strategy2';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Connection, createConnection} from 'typeorm';
import {AppController} from './app.controller';
import {AuthModule} from './modules/auth/auth.module';
import {ConfigurationModule} from './modules/configuration/configuration.module';
import {UserModule} from './modules/user/user.module';
import {DrawModule} from './modules/vrtournaments/draw/draw.module';
import {EventModule} from './modules/vrtournaments/event/event.module';
import {LicenseModule} from './modules/vrtournaments/license/license.module';
import {MatchModule} from './modules/vrtournaments/match/match.module';
import {MatchPlayerModule} from './modules/vrtournaments/match_player/match_player.module';
import {PlayerModule} from './modules/player/player.module';
import {SeafileModule} from './modules/Seafile/seafile.module';
import {TennisAssociationModule} from './modules/tennis_association/tennis_association.module';
import {TournamentModule} from './modules/vrtournaments/tournament/tournament.module';
import {MailerModule} from '@nestjs-modules/mailer';
import {VRAPIModule} from './modules/VRAPI/vrapi.module';
import {VRRankingsTypeModule} from './modules/vrrankings/type/type.module';
import {VRRankingsCategoryModule} from './modules/vrrankings/category/category.module';
import {VRRankingsPublicationModule} from './modules/vrrankings/publication/publication.module';
import {CALENDAR_DB, ConfigurationService, TC_STATS_DB} from './modules/configuration/configuration.service';
import {MatchDataExporterModule} from './modules/exporters/match-data/match-data-exporter.module';
import {ExternalPlayerModule} from './modules/external-tournaments/external-player/external-player.module';
import {ExternalTournamentService} from './modules/external-tournaments/external-tournament/external-tournament.service';
import {ExternalTournamentController} from './modules/external-tournaments/external-tournament/external-tournament.controller';
import {ExternalTournamentModule} from './modules/external-tournaments/external-tournament/external-tournament.module';
import {ExternalEventModule} from './modules/external-tournaments/external-event/external-event.module';
import {PointExchangeService} from './modules/external-tournaments/point-exchange/point-exchange.service';
import {PointExchangeModule} from './modules/external-tournaments/point-exchange/point-exchange.module';
import {ExternalEventResultController} from './modules/external-tournaments/external-event-result/external-event-result.controller';
import {ExternalEventResultModule} from './modules/external-tournaments/external-event-result/external-event-result.module';
import {ItfMatchResultsService} from './modules/external-tournaments/itf-match-results/itf-match-results.service';
import {ItfMatchResultsController} from './modules/external-tournaments/itf-match-results/itf-match-results.controller';
import {ItfMatchResultsModule} from './modules/external-tournaments/itf-match-results/itf-match-results.module';
import {ITFAPIModule} from './modules/ITFAPI/itfapi.module';
import {ExternalapiModule} from './modules/externalAPIModule/externalapi.module';
import {LocalStrategy} from './guards/local.strategy';
import {CalendarModule} from './modules/calendar-support/calendar.module';
import {CalendarService} from './modules/calendar-support/calendar.service';
import {TournamentGradeApprovalModule} from './modules/tournament-grade-approval/tournament-grade-approval.module';

@Module({
  imports: [
    // Config for TypeOrmModule (and type ORM for that matter).
    // This is very finicky stuff and far from clear.  It is borrowed
    // mostly from the NestJS documentation.  It became much more complex
    // when I had to add a second database of tournaments and events that
    // feeds the Tennis Canada calendar application.
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      name: 'default',
      useFactory: (configService: ConfigurationService) => {
        return configService.generateTypeOrmOptions(TC_STATS_DB);
      },
      connectionFactory: async (options) => {
        return await createConnection(options);
      }
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      inject: [ConfigurationService],
      name: 'calendar',
      useFactory: (configService: ConfigurationService) => {
        return configService.generateTypeOrmOptions(CALENDAR_DB);
      },
      connectionFactory: async (options) => {
        return await createConnection(options);
      }
    }),
    MailerModule.forRootAsync(
      {
        imports: [ConfigurationModule],
        useExisting: ConfigurationService,
      }),
    PassportModule,
    AuthModule,
    MailerModule,
    ConfigurationModule,
    UserModule,
    EventModule,
    DrawModule,
    HttpModule,
    LicenseModule,
    MatchModule,
    MatchPlayerModule,
    PlayerModule,
    SeafileModule,
    TennisAssociationModule,
    TournamentModule,
    MatchDataExporterModule,
    VRAPIModule,
    VRRankingsTypeModule,
    VRRankingsCategoryModule,
    VRRankingsPublicationModule,
    ExternalPlayerModule,
    ExternalTournamentModule,
    ExternalEventModule,
    PointExchangeModule,
    ExternalEventResultModule,
    ItfMatchResultsModule,
    ITFAPIModule,
    ExternalapiModule,
    CalendarModule,
    TournamentGradeApprovalModule,
  ],
  controllers: [
    AppController,
    ExternalTournamentController,
    ExternalEventResultController,
    ItfMatchResultsController,
  ],
  providers: [
    ExternalTournamentService,
    PointExchangeService,
    ItfMatchResultsService,
    LocalStrategy,
    JwtStrategy,
    JwtStrategy2,
    CalendarService,
  ],
  exports: [
    TypeOrmModule
  ],
})

export class AppModule {
  constructor(private readonly connection: Connection) {}
}
