import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {ITFMatchDTO, MatchDataExporterService} from './match-data-exporter.service';
import {JobStats} from '../../../utils/jobstats';

@Controller('Exports')
export class MatchDataExporterController {
  constructor(private readonly service: MatchDataExporterService) {}

  @Get('/buildUTRReport/status')
  @UseGuards(AuthGuard('bearer'))
  async buildUTRReportStatus(): Promise<JobStats> {
    return this.service.getBuildReportStats();
  }

  @Get('/UTRReport')
  @UseGuards(AuthGuard('bearer'))
  async buildUTRReport(): Promise<JobStats> {
    return await this.service.buildUTRReport();
  }

  @Get('/ITFMatchData')
  @UseGuards(AuthGuard('bearer'))
  async getITFMatchData(@Query() query): Promise<ITFMatchDTO[]> {
    return await this.service.buildITFMatchData(query.updatedSince);
  }
}
