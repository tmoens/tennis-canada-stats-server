import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ExternalTournamentService } from './external-tournament.service';
import { ExternalTournament } from './external-tournament.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('ExternalTournament')
export class ExternalTournamentController {
  constructor(private readonly service: ExternalTournamentService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ExternalTournament[]> {
    return await this.service.findAll();
  }

  @Get('getFilteredTournaments')
  @UseGuards(JwtAuthGuard)
  async getFilteredTournaments(
    @Query() query,
  ): Promise<ExternalTournament[] | null> {
    return await this.service.getFilteredTournaments(query);
  }

  @Post('UpdateCategory/:tournamentId/:category')
  @UseGuards(JwtAuthGuard)
  async updateCategory(@Param() params): Promise<any> {
    return await this.service.updateCategory(
      params.tournamentId,
      params.category,
    );
  }
}
