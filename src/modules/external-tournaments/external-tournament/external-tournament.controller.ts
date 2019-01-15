import {Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ExternalTournamentService} from './external-tournament.service';
import {ExternalTournament} from './external-tournament.entity';

@Controller('ExternalTournament')
export class ExternalTournamentController {
  constructor(
    private readonly service: ExternalTournamentService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<ExternalTournament[]> {
    return await this.service.findAll();
  }

  @Get('getFilteredTournaments')
  @UseGuards(AuthGuard('bearer'))
  async getFilteredTournaments(@Query() query): Promise<ExternalTournament[] | null> {
    return await this.service.getFilteredTournaments(query);
  }

  @Post('UpdateSubCategory/:tournamentId/:subCategory')
  @UseGuards(AuthGuard('bearer'))
  async updateSubCategory(@Param() params): Promise<ExternalTournament> {
    return await this.service.updateSubCategory(params.tournamentId, params.subCategory);
  }
}
