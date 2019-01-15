import {Controller, Get, Param, Put, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ExternalPlayer} from './external-player.entity';
import {ExternalPlayerService} from './external-player.service';

@Controller('ExternalPlayer')
export class ExternalPlayerController {
  constructor(
    private readonly service: ExternalPlayerService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<ExternalPlayer[]> {
    return await this.service.findAll();
  }

  @Get('GetExternalPlayers')
  @UseGuards(AuthGuard('bearer'))
  async findByNameOrITFId(@Query() query): Promise<any> {
    return await this.service.getExternalPlayers((query.missingVRID === 'true'), query.searchString);
  }

  @Get('FindVRMatches/:id')
  @UseGuards(AuthGuard('bearer'))
  async FindVRMatches(@Param() params): Promise<any[] | null> {
    return await this.service.FindVRMatches(params.id);
  }

  @Put('SetVRId/:ExternalId/:VRId')
  @UseGuards(AuthGuard('bearer'))
  async SetVRId(@Param() params): Promise<ExternalPlayer | null> {
    return await this.service.setVRId(params.ExternalId, params.VRId);
  }

}
