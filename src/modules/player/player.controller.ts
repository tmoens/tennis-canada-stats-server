import {
  Body,
  Controller,
  FileInterceptor,
  Get,
  HttpException, HttpStatus,
  Post, Req,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {PlayerMergeRecord, PlayerService} from './player.service';
import { Player } from './player.entity';
import csv = require('csvtojson');
import {AuthGuard} from '@nestjs/passport';

@Controller('Player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService) {
  }

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Player[]> {
    return await this.playerService.findAll();
  }

  @Post('renumber')
  @UseGuards(AuthGuard('bearer'))
  async renumberPlayer(@Body() playerMergeRecord: PlayerMergeRecord): Promise<any> {
    return await this.playerService.renumberPlayer(playerMergeRecord);
  }

  @Get('importVRPersonsCSV/status')
  @UseGuards(AuthGuard('bearer'))
  importVRPersonsStatus(): any {
    return this.playerService.getPersonImportStatus();
  }

  @Post('importVRPersonsCSV')
  @UseInterceptors(FileInterceptor('file',
    {dest: 'uploads/players/VRPersons'}))
  @UseGuards(AuthGuard('bearer'))
  async importVRPersonsCSV(@Req() request, @UploadedFile() file) {
    // Check the validity of the file.
    const expectedHeaders: Array<string> = ['code', 'memberid', 'lastname', 'lastname2',
      'middlename', 'firstname', 'address', 'address2', 'address3',
      'postalcode', 'city', 'state', 'country', 'nationality', 'gender',
      'dob', 'phone', 'phone2', 'mobile', 'fax', 'fax2', 'email', 'website'];

    // Note that if I call this from Postman, or my Angular client with the exact
    // same file, the mimetype of the file  comes in as "text/csv" in the first
    // case and "application/vnd.ms-excel" in the second.
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      throw new HttpException('Bad file type: ' + file.mimetype, HttpStatus.NOT_ACCEPTABLE);
    }

    // arguably this should be done in the service, but it is async
    // and I was having trouble throwing an exception from there in such
    // a way that this function could always return before the heavy loading
    // got going.
    const players: any[] = await csv()
      .fromFile(file.path )
      .on('header', (headers) =>
      {
        for (const header of expectedHeaders) {
          if (headers.indexOf(header) < 0) {
            throw new HttpException('Player file did not include column: ' + header,
              HttpStatus.NOT_ACCEPTABLE);
          }
        }
      });

    // We are intentionally not waiting for the promise to be returned here, because
    // it could take several minutes and we need to return from this handler.
    // Clients can watch the progress by polling importVRPersonsCSV/status
    this.playerService.importVRPersons(players);
  }
}
