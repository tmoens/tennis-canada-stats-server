import {Controller, Get, UseGuards} from '@nestjs/common';
import { MatchService } from './match.service';
import { Match } from './match.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('Match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Match[]> {
    return await this.matchService.findAll();
  }
}
