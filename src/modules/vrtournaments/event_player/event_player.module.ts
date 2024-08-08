import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventPlayerService } from './event_player.service';
import { PlayerModule } from '../../player/player.module';
import { EventPlayer } from './event_player.entity';
import { EventPlayerController } from './event_player.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventPlayer]),
    forwardRef(() => PlayerModule),
  ],
  providers: [EventPlayerService],
  controllers: [EventPlayerController],
  exports: [EventPlayerService],
})
export class EventPlayerModule {}
