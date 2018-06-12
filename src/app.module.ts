import { Module } from '@nestjs/common';
import { HttpModule } from "@nestjs/common/http";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import { AppController } from './app.controller';
import {TournamentModule} from "./modules/vrtournaments/tournament/tournament.module";
import {StatsModule} from "./modules/stats/stats.module";
import {EventModule} from "./modules/vrtournaments/event/event.module";
import {PlayerModule} from "./modules/player/player.module";
import {VRAPIModule} from "./modules/VRAPI/vrapi.module";
import {LicenseModule} from "./modules/vrtournaments/license/license.module";
import {DrawModule} from "./modules/vrtournaments/draw/draw.module";
import {MatchModule} from "./modules/vrtournaments/match/match.module";
import {VRRankingsTypeModule} from "./modules/vrrankings/type/type.module";
import {VRRankingsCategoryModule} from "./modules/vrrankings/category/category.module";
import {VRRankingsPublicationModule} from "./modules/vrrankings/publication/publication.module";
import {MatchPlayerModule} from "./modules/vrtournaments/match_player/match_player.module";
import {TennisAssociationModule} from "./modules/tennis_association/tennis_association.module";

@Module({
  imports: [
    // Config for TypeOrmModule (and type ORM for that matter) is in ormconfig.json
    TypeOrmModule.forRoot(),
    EventModule,
    DrawModule,
    HttpModule,
    LicenseModule,
    MatchModule,
    MatchPlayerModule,
    PlayerModule,
    StatsModule,
    TennisAssociationModule,
    TournamentModule,
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