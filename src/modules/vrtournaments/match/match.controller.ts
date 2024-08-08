import { Controller, Get, UseGuards } from '@nestjs/common';
import { MatchService } from './match.service';
import { Match } from './match.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Match[]> {
    return await this.matchService.findAll();
  }
}
