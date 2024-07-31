import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchService } from './match.service';
import { MatchController } from './match.controller';
import { Match } from './match.entity';
import {MatchPlayerModule} from '../match_player/match_player.module';
import {VRAPIModule} from '../../VRAPI/vrapi.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match]),
    MatchPlayerModule,
    VRAPIModule,
  ],
  providers: [
    MatchService,
  ],
  controllers: [
    MatchController
  ],
  exports: [MatchService]
})
export class MatchModule {}