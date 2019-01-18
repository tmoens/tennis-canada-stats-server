import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UtrService } from './utr.service';
import {JobStats} from '../../../utils/jobstats';

@Controller('UTR')
export class UtrController {
  constructor(private readonly service: UtrService) {}

  @Get('/buildUTRReport/status')
  @UseGuards(AuthGuard('bearer'))
  async buildUTRReportStatus(): Promise<JobStats> {
    return this.service.getBuildReportStats();
  }

  @Get('/buildUTRReport')
  // @UseGuards(AuthGuard('bearer'))
  async buildUTRReport(): Promise<JobStats> {
    return await this.service.buildUTRReport();
  }
}
