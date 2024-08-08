import { Controller, Get, UseGuards } from '@nestjs/common';
import { MatchPlayerService } from './match_player.service';
import { MatchPlayer } from './match_player.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('MatchPlayer')
export class MatchPlayerController {
  constructor(private readonly matchPlayerService: MatchPlayerService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<MatchPlayer[]> {
    return await this.matchPlayerService.findAll();
  }
}
