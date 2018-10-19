import {Controller, Get, Param, UseGuards} from '@nestjs/common';
import { VRRankingsPublicationService } from './publication.service';
import { VRRankingsPublication } from './publication.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('VRRankingsPublication')
export class VRRankingsPublicationController {
  constructor(private readonly vrrankingspublicationService: VRRankingsPublicationService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<VRRankingsPublication[]> {
    return await this.vrrankingspublicationService.findAll();
  }

  @Get('/code/:code')
  @UseGuards(AuthGuard('bearer'))
  async findBycode(@Param() params): Promise<VRRankingsPublication> {
    return await this.vrrankingspublicationService.findByCode(params.code);
  }
}
