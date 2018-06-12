import { Controller, Get } from '@nestjs/common';
import { MatchService } from './match.service';
import { Match } from './match.entity';

@Controller('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  async findAll(): Promise<Match[]> {
    return await this.matchService.findAll();
  }
}
