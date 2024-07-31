import {forwardRef, Module} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {MatchPlayer} from './match_player.entity';
import {MatchPlayerService} from './match_player.service';
import {MatchPlayerController} from './match_player.controller';
import {PlayerModule} from '../../player/player.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MatchPlayer]),
    forwardRef(() => PlayerModule),
  ],
  providers: [
    MatchPlayerService,
  ],
  controllers: [
    MatchPlayerController
  ],
  exports: [MatchPlayerService]
})
export class MatchPlayerModule {}