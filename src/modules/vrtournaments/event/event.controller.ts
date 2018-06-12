import {Controller, Get, Param} from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import {ParamsTokenFactory} from "@nestjs/core/pipes/params-token-factory";

@Controller('Event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('roster/:id')
  async getRoster(@Param() params): Promise<any[]> {
    return await this.eventService.getRoster(params.id);
  }

  @Get()
  async findAll(): Promise<Event[]> {
    return await this.eventService.findAll();
  }

}
