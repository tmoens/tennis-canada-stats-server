import { Controller, Get } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { Tournament } from './tournament.entity';

@Controller('Tournament')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}


  @Get()
  async findAll(): Promise<Tournament[]> {
    return await this.tournamentService.findAll();
  }
  @Get('/import')
  async importTournamentsFromVR(): Promise<any> {
    return await this.tournamentService.importTournamentsFromVR(2018);
  }
}
