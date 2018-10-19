import {Controller, Get, UseGuards} from '@nestjs/common';
import {MatchPlayerService} from './match_player.service';
import {MatchPlayer} from './match_player.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('MatchPlayer')
export class MatchPlayerController {
  constructor(private readonly matchPlayerService: MatchPlayerService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<MatchPlayer[]> {
    return await this.matchPlayerService.findAll();
  }
}
