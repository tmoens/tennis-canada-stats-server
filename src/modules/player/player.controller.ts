import {
  Controller,
  Get,
  HttpException, HttpStatus, Param,
  Post, Query, Req, Res,
  UploadedFile, UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {ITFPlayerDataDTO, PlayerMergeRecord, PlayerService} from './player.service';
import { Player } from './player.entity';
import csv = require('csvtojson');
import {PlayerIdentityService} from './playerIdentity.service';
import {getLogger} from 'log4js';
import {FileInterceptor} from '@nestjs/platform-express';
import {JwtAuthGuard} from '../../guards/jwt-auth.guard';

@Controller('Player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly identityService: PlayerIdentityService,
    ) {
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Player[]> {
    return await this.playerService.findAll();
  }

  @Get('ITFPlayerData')
  @UseGuards(JwtAuthGuard)
  async getITFPlayerData(): Promise<ITFPlayerDataDTO[]> {
    return await this.playerService.getITFPlayerData();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param() params): Promise<Player> {
    return await this.playerService.findById(params.id);
  }

  @Get('importVRPersonMergesCSV/status')
  @UseGuards(JwtAuthGuard)
  importVRPersonMergesStatus(): any {
    return this.playerService.getPersonMergesImportStatus();
  }

  @Post('importVRPersonMergesCSV')
  @UseInterceptors(FileInterceptor('file',
    {dest: 'uploads/players/VRPersonMerges'}))
  @UseGuards(JwtAuthGuard)
  async importVRPersonMergesCSV(@Req() request, @UploadedFile() file) {
    // Check the validity of the file.
    const expectedHeaders: Array<string> = ['fromPlayerId', 'fromFirstName',
      'fromLastName',	'toPlayerId', 'toFirstName',	'toLastName',	'date'];

    // Note that if I call this from Postman, or my Angular client with the exact
    // same file, the mimetype of the file  comes in as "text/csv" in the first
    // case and "application/vnd.ms-excel" in the second.
    if (file.mimetype !== 'text/csv' && file.mimetype !== 'application/vnd.ms-excel') {
      throw new HttpException('Bad file type: ' + file.mimetype, HttpStatus.NOT_ACCEPTABLE);
    }

    // arguably this should be done in the service. But the operation is async,
    // and I was having trouble throwing an exception from there in such
    // a way that this function could always return before the heavy loading
    // got going.
    const merges: PlayerMergeRecord[] = await csv()
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
    this.playerService.importVRPersonMerges(merges);
  }

  @Get('importVRPersonsCSV/status')
  @UseGuards(JwtAuthGuard)
  importVRPersonsStatus(): any {
    return this.playerService.getPersonImportStatus();
  }

  @Post('importVRPersonsCSV')
  @UseInterceptors(FileInterceptor('file',
    {dest: 'uploads/players/VRPersons'}))
  @UseGuards(JwtAuthGuard)
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

    // arguably this should be done in the service, but it is async,
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
    this.playerService.importVRPersons(players).then();
  }

  /* This is for Validating BC Club membership lists */
  @Post('check')
  @UseInterceptors(FileInterceptor('file',
    {dest: 'uploads/players/BCMemberChecks'}))
  @UseGuards(JwtAuthGuard)
  async checkPlayers(@Req() request, @UploadedFile() file) {
    const valid: boolean = await this.identityService.validateFile(file);
    if (!valid) {
      throw new HttpException('Member lists contained one or more errors: ' +
        JSON.stringify(this.identityService.getCheckPlayerStatus().getHistory(), null, 2),
        HttpStatus.NOT_ACCEPTABLE);
    }
  }

  @Get('check/status')
  @UseGuards(JwtAuthGuard)
  checkPlayersStatus(): any {
    return this.identityService.getCheckPlayerStatus();
  }
  @Get('check/downloadReport')
  // TODO figure out how to guard this - client is an <a>...</a>
  // which does not send auth headers. no private data so it is ok.
  // @UseGuards(JwtAuthGuard)
  async exportMemberCheckReport( @Res() response, @Query() query): Promise<any> {
    const logger = getLogger('eventRatingsReport');
    logger.info('Request to download ' + query.filename);
    response.status(HttpStatus.OK);
    await response.download(query.filename);
    logger.info('Download complete');
    // TODO THis might be a good place to clean the file up so no more downloads
  }
}

