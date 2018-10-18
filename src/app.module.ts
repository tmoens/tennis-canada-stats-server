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
import {UtrModule} from './modules/reporters/UTRReports/utr.module';

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
    UtrModule,
    VRAPIModule,
    VRRankingsTypeModule,
    VRRankingsCategoryModule,
    VRRankingsPublicationModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
  ],
})

export class AppModule {
  constructor(private readonly connection: Connection) {}
}