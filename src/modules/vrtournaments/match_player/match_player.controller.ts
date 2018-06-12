import { Controller, Get } from '@nestjs/common';
import {MatchPlayerService} from "./match_player.service";
import {MatchPlayer} from "./match_player.entity";

@Controller('MatchPlayer')
export class MatchPlayerController {
  constructor(private readonly matchPlayerService: MatchPlayerService) {}

  @Get()
  async findAll(): Promise<MatchPlayer[]> {
    return await this.matchPlayerService.findAll();
  }
}
