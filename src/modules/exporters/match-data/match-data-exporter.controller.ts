import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {ITFMatchDTO, MatchDataExporterService} from './match-data-exporter.service';
import {JobStats} from '../../../utils/jobstats';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('Exports')
export class MatchDataExporterController {
  constructor(private readonly service: MatchDataExporterService) {}

  @Get('/buildUTRReport/status')
  @UseGuards(JwtAuthGuard)
  async buildUTRReportStatus(): Promise<JobStats> {
    return this.service.getBuildReportStats();
  }

  @Get('/UTRReport')
  @UseGuards(JwtAuthGuard)
  async buildUTRReport(): Promise<JobStats> {
    return await this.service.buildUTRReport();
  }

  @Get('/ITFMatchData')
  @UseGuards(JwtAuthGuard)
  async getITFMatchData(@Query() query): Promise<ITFMatchDTO[]> {
    return await this.service.buildITFMatchData(query.updatedSince);
  }
}
