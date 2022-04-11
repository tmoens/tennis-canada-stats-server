import {Controller, Get, UseGuards} from '@nestjs/common';
import {JobStats} from '../../../utils/jobstats';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';
import {MatchDataExporterService} from './match-data-exporter.service';

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
}
