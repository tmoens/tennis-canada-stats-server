import { Controller, Get } from '@nestjs/common';
import {EventPlayerService} from './event_player.service';
import {EventPlayer} from './event_player.entity';

@Controller('EventPlayer')
export class EventPlayerController {
  constructor(private readonly eventPlayerService: EventPlayerService) {}

  @Get()
  async findAll(): Promise<EventPlayer[]> {
    return await this.eventPlayerService.findAll();
  }
}