import {Controller, Get, HttpStatus, Query, Res, UseGuards} from '@nestjs/common';
import { EventService } from './event.service';
import { Event } from './event.entity';
import {getLogger} from 'log4js';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('Event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Event[]> {
    return await this.eventService.findAll();
  }

  @Get('buildRatingsReport/status')
  @UseGuards(JwtAuthGuard)
  getRatingsStats(): any {
    return this.eventService.getRatingStats();
  }

  @Get('buildRatingsReport')
  @UseGuards(JwtAuthGuard)
  async buildRatingsReport( @Query() query) {
    const logger = getLogger('eventRatingsReport');
    logger.info('Request to generate report. Query: ' + JSON.stringify(query, null, 2));
    this.eventService.rateEvents(
      query.from, query.to, query.province, query.categories.split(','));
    logger.info('Report generation complete.');
  }

  @Get('downloadRatingsReport')
  // TODO figure out how to guard this - client is an <a>...</a>
  // which does not send auth headers. no private data so it is ok.
  // @UseGuards(JwtAuthGuard)
  async exportRatingsReport( @Res() response, @Query() query): Promise<any> {
    const logger = getLogger('eventRatingsReport');
    logger.info('Request to download ' + query.filename);
    response.status(HttpStatus.OK);
    await response.download(query.filename);
    logger.info('Download complete');
    // TODO THis might be a good place to clean stuff up.
  }
}
