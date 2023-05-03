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

  // TODO add a jobstatus thingy to track the status of the report generation

  @Get('buildRatingsReport')
  @UseGuards(JwtAuthGuard)
  async buildRatingsReport( @Query() query): Promise<any> {
    const logger = getLogger('eventRatingsReport');
    logger.info('Request to generate report. Query: ' + JSON.stringify(query, null, 2));
    const filename: string = await this.eventService.rateEvents(
      query.from, query.to, query.province, query.categories.split(','));
    logger.info('Report generation complete.');
    return ({filename});
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
