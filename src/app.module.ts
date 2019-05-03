import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/common/http';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { AppController } from './app.controller';
import {AuthModule} from './modules/auth/auth.module';
import {ConfigurationModule} from './modules/configuration/configuration.module';
import {DrawModule} from './modules/vrtournaments/draw/draw.module';
import {EventModule} from './modules/vrtournaments/event/event.module';
import {LicenseModule} from './modules/vrtournaments/license/license.module';
import {MatchModule} from './modules/vrtournaments/match/match.module';
import {MatchPlayerModule} from './modules/vrtournaments/match_player/match_player.module';
import {PlayerModule} from './modules/player/player.module';
import {SeafileModule} from './modules/Seafile/seafile.module';
import {TennisAssociationModule} from './modules/tennis_association/tennis_association.module';
import {TournamentModule} from './modules/vrtournaments/tournament/tournament.module';
import {VRAPIModule} from './modules/VRAPI/vrapi.module';
import {VRRankingsTypeModule} from './modules/vrrankings/type/type.module';
import {VRRankingsCategoryModule} from './modules/vrrankings/category/category.module';
import {VRRankingsPublicationModule} from './modules/vrrankings/publication/publication.module';
import {ConfigurationService} from './modules/configuration/configuration.service';
import {MatchDataExporterModule} from './modules/exporters/match-data/match-data-exporter.module';
import { ExternalPlayerModule } from './modules/external-tournaments/external-player/external-player.module';
import { ExternalTournamentService } from './modules/external-tournaments/external-tournament/external-tournament.service';
import { ExternalTournamentController } from './modules/external-tournaments/external-tournament/external-tournament.controller';
import { ExternalTournamentModule } from './modules/external-tournaments/external-tournament/external-tournament.module';
import { ExternalEventModule } from './modules/external-tournaments/external-event/external-event.module';
import { PointExchangeService } from './modules/external-tournaments/point-exchange/point-exchange.service';
import { PointExchangeModule } from './modules/external-tournaments/point-exchange/point-exchange.module';
import { ExternalEventResultController } from './modules/external-tournaments/external-event-result/external-event-result.controller';
import { ExternalEventResultModule } from './modules/external-tournaments/external-event-result/external-event-result.module';
import { ItfMatchResultsService } from './modules/external-tournaments/itf-match-results/itf-match-results.service';
import { ItfMatchResultsController } from './modules/external-tournaments/itf-match-results/itf-match-results.controller';
import { ItfMatchResultsModule } from './modules/external-tournaments/itf-match-results/itf-match-results.module';
import {ITFAPIModule} from './modules/ITFAPI/itfapi.module';
import {ExternalapiModule} from './modules/externalAPIModule/externalapi.module';

@Module({
  imports: [
    // Config for TypeOrmModule (and type ORM for that matter) is in ormconfig.json
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      useExisting: ConfigurationService,
    }),
    PassportModule,
    AuthModule,
    ConfigurationModule,
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
  ],
  exports: [
  ],
})

export class AppModule {
  constructor(private readonly connection: Connection) {}
}