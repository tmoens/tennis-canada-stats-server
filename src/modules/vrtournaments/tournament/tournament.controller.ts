import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TournamentService } from './tournament.service';
import { Tournament } from './tournament.entity';
import {getLogger} from 'log4js';

@Controller('Tournament')
export class TournamentController {
  constructor(
    private readonly tournamentService: TournamentService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Tournament[]> {
    return await this.tournamentService.findAll();
  }

  @Get('/import/status')
  @UseGuards(AuthGuard('bearer'))
  importVRPersonsStatus(): any {
    return this.tournamentService.getImportStatus();
  }

  @Get('/import')
  @UseGuards(AuthGuard('bearer'))
  async importTournamentsFromVR(): Promise<any> {
    return await this.tournamentService.importTournamentsFromVR();
  }

  @Get('/buildPlayReport')
  @UseGuards(AuthGuard('bearer'))
  async buildRatingsReport( @Query() query): Promise<any[]> {
    const logger = getLogger('overallPlayReport');
    logger.info('Request to generate report. Query: ' + JSON.stringify(query));
    return this.tournamentService.getPlayReport(query.from, query.to);
  }
}
