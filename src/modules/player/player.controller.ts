import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ITFPlayerDataDTO,
  PlayerMergeRecord,
  PlayerService,
} from './player.service';
import { Player } from './player.entity';
import csv = require('csvtojson');
import { getLogger } from 'log4js';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('Player')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

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
  async findById(@Param('id', new ParseIntPipe()) id: number): Promise<Player> {
    return await this.playerService.findById(id);
  }

  @Get('importVRPersonMergesCSV/status')
  @UseGuards(JwtAuthGuard)
  importVRPersonMergesStatus(): any {
    return this.playerService.getPersonMergesImportStatus();
  }

  @Post('importVRPersonMergesCSV')
  @UseInterceptors(
    FileInterceptor('file', { dest: 'uploads/players/VRPersonMerges' }),
  )
  @UseGuards(JwtAuthGuard)
  async importVRPersonMergesCSV(@UploadedFile() file: Express.Multer.File) {
    // Check the validity of the file.
    const expectedHeaders: Array<string> = [
      'fromPlayerId',
      'fromFirstName',
      'fromLastName',
      'toPlayerId',
      'toFirstName',
      'toLastName',
      'date',
    ];

    // Note that if I call this from Postman, or my Angular client with the exact
    // same file, the mimetype of the file  comes in as "text/csv" in the first
    // case and "application/vnd.ms-excel" in the second.
    if (
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new HttpException(
        'Bad file type: ' + file.mimetype,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // arguably this should be done in the service. But the operation is async,
    // and I was having trouble throwing an exception from there in such
    // a way that this function could always return before the heavy loading
    // got going.
    const merges: PlayerMergeRecord[] = await csv()
      .fromFile(file.path)
      .on('header', (headers) => {
        for (const header of expectedHeaders) {
          if (headers.indexOf(header) < 0) {
            throw new HttpException(
              'Player file did not include column: ' + header,
              HttpStatus.NOT_ACCEPTABLE,
            );
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
  @UseInterceptors(
    FileInterceptor('file', { dest: 'uploads/players/VRPersons' }),
  )
  @UseGuards(JwtAuthGuard)
  async importVRPersonsCSV(@UploadedFile() file: Express.Multer.File) {
    // Check the validity of the file.
    const expectedHeaders: Array<string> = [
      'code',
      'memberid',
      'lastname',
      'lastname2',
      'middlename',
      'firstname',
      'address',
      'address2',
      'address3',
      'postalcode',
      'city',
      'state',
      'country',
      'nationality',
      'gender',
      'dob',
      'phone',
      'phone2',
      'mobile',
      'fax',
      'fax2',
      'email',
      'website',
    ];

    // Note that if I call this from Postman, or my Angular client with the exact
    // same file, the mimetype of the file  comes in as "text/csv" in the first
    // case and "application/vnd.ms-excel" in the second.
    if (
      file.mimetype !== 'text/csv' &&
      file.mimetype !== 'application/vnd.ms-excel'
    ) {
      throw new HttpException(
        'Bad file type: ' + file.mimetype,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }

    // arguably this should be done in the service, but it is async,
    // and I was having trouble throwing an exception from there in such
    // a way that this function could always return before the heavy loading
    // got going.
    const players: any[] = await csv()
      .fromFile(file.path)
      .on('header', (headers) => {
        for (const header of expectedHeaders) {
          if (headers.indexOf(header) < 0) {
            throw new HttpException(
              'Player file did not include column: ' + header,
              HttpStatus.NOT_ACCEPTABLE,
            );
          }
        }
      });

    // We are intentionally not waiting for the promise to be returned here, because
    // it could take several minutes and we need to return from this handler.
    // Clients can watch the progress by polling importVRPersonsCSV/status
    this.playerService.importVRPersons(players).then();
  }

  @Get('check/downloadReport')
  // TODO figure out how to guard this - client is an <a>...</a>
  // which does not send auth headers. no private data so it is ok.
  // @UseGuards(JwtAuthGuard)
  async exportMemberCheckReport(
    @Res() response: Response,
    @Query() query,
  ): Promise<any> {
    const logger = getLogger('eventRatingsReport');
    logger.info('Request to download ' + query.filename);
    response.status(HttpStatus.OK);
    response.download(query.filename);
    logger.info('Download complete');
    // TODO THis might be a good place to clean the file up so no more downloads
  }
}
