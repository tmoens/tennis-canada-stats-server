import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TournamentService } from './tournament.service';
import { Tournament } from './tournament.entity';
import {SeafileService} from '../../Seafile/seafile.service';

@Controller('Tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService,
              private readonly seafileService: SeafileService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Tournament[]> {
    return await this.tournamentService.findAll();
  }

  @Get('/import')
  @UseGuards(AuthGuard('bearer'))
  async importTournamentsFromVR(): Promise<any> {
    return await this.tournamentService.importTournamentsFromVR();
  }

  @Get('/status/importVRTournaments')
  importVRPersonsStatus(): any {
    return this.tournamentService.getImportStatus();
  }
}
