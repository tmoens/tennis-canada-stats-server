import {Controller, Get, HttpStatus, Query, Res, UseGuards} from '@nestjs/common';
import {JobStats} from '../../../utils/jobstats';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';
import {MatchDataExporterService} from './match-data-exporter.service';
import {getLogger} from 'log4js';

@Controller('Exports')
export class MatchDataExporterController {
  constructor(private readonly service: MatchDataExporterService) {}

  @Get('/buildUTRReport/status')
  @UseGuards(JwtAuthGuard)
  async buildUTRReportStatus(): Promise<JobStats> {
    return this.service.getBuildUTRReportStats();
  }

  @Get('/UTRReport')
  @UseGuards(JwtAuthGuard)
  async buildUTRReport(): Promise<JobStats> {
    return await this.service.buildUTRReport();
  }

  @Get('MatchCompetitivenessReport/build/status')
  @UseGuards(JwtAuthGuard)
  async buildMatchCompetitivenessReportStatus(): Promise<JobStats> {
    return this.service.getBuildMatchCompetitivenessReportStats();
  }

  @Get('MatchCompetitivenessReport/build')
  @UseGuards(JwtAuthGuard)
  buildMatchCompetitivenessReport() {
    this.service.buildMatchCompetitivenessReport();
  }

  @Get('MatchCompetitivenessReport/download')
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
