import {Controller, Get, Param, Query, UseGuards} from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('Event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get('roster/:id')
  async getRoster(@Param() params): Promise<any[]> {
    return await this.eventService.getRoster(params.id);
  }

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Event[]> {
    return await this.eventService.findAll();
  }

  @Get('/ratingsReport')
  async exportRatingsReport(@Query() query): Promise<any> {
    const filename: string = await this.eventService.rateEvents(
      query.from, query.to, query.province, query.categories.split(','), query.gender);
    return {whatever: 'whatever, dude'};
  }
}
