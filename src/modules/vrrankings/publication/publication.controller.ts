import { Controller, Get, Param } from '@nestjs/common';
import { VRRankingsPublicationService } from './publication.service';
import { VRRankingsPublication } from './publication.entity';

@Controller('VRRankingsPublication')
export class VRRankingsPublicationController {
  constructor(private readonly vrrankingspublicationService: VRRankingsPublicationService) {}


  @Get()
  async findAll(): Promise<VRRankingsPublication[]> {
    return await this.vrrankingspublicationService.findAll();
  }

  @Get('/code/:code')
  async findBycode(@Param() params): Promise<VRRankingsPublication> {
    return await this.vrrankingspublicationService.findByCode(params.code);
  }
}
