import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlayerController } from './player.controller';
import { Player } from './player.entity';
import {VRAPIModule} from '../VRAPI/vrapi.module';
import {MatchPlayerModule} from '../vrtournaments/match_player/match_player.module';
import {VRRankingsItemModule} from '../vrrankings/item/item.module';
import {EventPlayerModule} from '../vrtournaments/event_player/event_player.module';
import {ExternalPlayerModule} from '../external-tournaments/external-player/external-player.module';
import {ExternalapiModule} from '../externalAPIModule/externalapi.module';
import {PlayerService} from './player.service';
import {PlayerIdentityService} from './playerIdentity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    ExternalapiModule,
    VRAPIModule,
    forwardRef(() => MatchPlayerModule),
    forwardRef(() => VRRankingsItemModule),
    forwardRef(() => EventPlayerModule),
    forwardRef(() => ExternalPlayerModule),
  ],
  providers: [
    PlayerService,
    PlayerIdentityService,
  ],
  controllers: [
    PlayerController,
  ],
  exports: [
    PlayerService,
  ],
})
export class PlayerModule {}
