import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerService } from './player.service';
import { PlayerController } from './player.controller';
import { Player } from './player.entity';
import {VRAPIModule} from "../VRAPI/vrapi.module";
import {MatchPlayerModule} from "../vrtournaments/match_player/match_player.module";
import {VRRankingsItemModule} from "../vrrankings/item/item.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    VRAPIModule,
    forwardRef(() => MatchPlayerModule),
    forwardRef(() => VRRankingsItemModule),

  ],
  providers: [
    PlayerService,
  ],
  controllers: [
    PlayerController
  ],
  exports: [
    PlayerService
  ]
})
export class PlayerModule {}
