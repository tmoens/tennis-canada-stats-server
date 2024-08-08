import { Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ExternalPlayer } from './external-player.entity';
import { ExternalPlayerService } from './external-player.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('ExternalPlayer')
export class ExternalPlayerController {
  constructor(private readonly service: ExternalPlayerService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ExternalPlayer[]> {
    return await this.service.findAll();
  }

  @Get('GetExternalPlayers')
  @UseGuards(JwtAuthGuard)
  async findByNameOrITFId(@Query() query): Promise<any> {
    return await this.service.getExternalPlayers(
      query.missingVRID === 'true',
      query.searchString,
    );
  }

  @Get('FindVRMatches/:id')
  @UseGuards(JwtAuthGuard)
  async FindVRMatches(@Param() params): Promise<any[] | null> {
    return await this.service.FindVRMatches(params.id);
  }

  @Put('SetVRId/:ExternalId/:VRId')
  @UseGuards(JwtAuthGuard)
  async SetVRId(@Param() params): Promise<ExternalPlayer | null> {
    return await this.service.setVRId(params.ExternalId, params.VRId);
  }
}
