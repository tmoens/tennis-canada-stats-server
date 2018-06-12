import {Controller, Get, Param} from '@nestjs/common';
import { PlayerService } from './player.service';
import { Player } from './player.entity';

@Controller('Player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}


  @Get()
  async findAll(): Promise<Player[]> {
    return await this.playerService.findAll();
  }

  @Get('renumber/:fromId/:toId')
  async renumberPlayer(@Param() params): Promise<any> {
    console.log("fromId: " + params.fromId + " toId: " + params.toId);
    return await this.playerService.renumberPlayer(params.fromId, params.toId,
      'testFFN', 'testTFN','test.FLN', 'testTLN', '2018-01-01');

  }
}
