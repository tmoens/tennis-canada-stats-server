import { Controller, Get, UseGuards } from '@nestjs/common';
import { EventPlayerService } from './event_player.service';
import { EventPlayer } from './event_player.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('EventPlayer')
export class EventPlayerController {
  constructor(private readonly eventPlayerService: EventPlayerService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<EventPlayer[]> {
    return await this.eventPlayerService.findAll();
  }
}
