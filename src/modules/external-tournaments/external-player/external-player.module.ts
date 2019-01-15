import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import { ExternalPlayerController } from './external-player.controller';
import { ExternalPlayerService } from './external-player.service';
import {ExternalPlayer} from './external-player.entity';
import {PlayerModule} from '../../player/player.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExternalPlayer]),
    PlayerModule,
  ],
  providers: [
    ExternalPlayerService,
  ],
  controllers: [
    ExternalPlayerController,
  ],
  exports: [
    ExternalPlayerService,
  ],
})
export class ExternalPlayerModule {}
