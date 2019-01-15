import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {EventRating} from './event-rating.entity';
import {EventRatingService} from './event-rating.service';

@Controller('EventRating')
export class EventRatingController {
  constructor(
    private readonly service: EventRatingService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<EventRating[]> {
    return await this.service.findAll();
  }
}
