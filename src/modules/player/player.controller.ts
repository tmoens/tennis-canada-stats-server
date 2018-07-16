import {Controller, FileInterceptor, Get, Param, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import { PlayerService } from './player.service';
import { Player } from './player.entity';

@Controller('Player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService) {
  }


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

  @Get('status/importVRPersons')
  importVRPersonsStatus(): any {
    return this.playerService.personImportJobStats;
  }

  @Post('importVRPersonsCSV')
  @UseInterceptors(FileInterceptor('file',
    {dest: 'uploads/players/VRPersons'}))
  importVRPersonsCSV(@UploadedFile() file):any {
    console.log(JSON.stringify(file));
    this.playerService.importVRPersons(file);
    return;
  }

}
