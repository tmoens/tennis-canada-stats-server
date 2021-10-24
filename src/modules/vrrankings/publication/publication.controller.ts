import {Controller, Get, Param, Query, UseGuards} from '@nestjs/common';
import { VRRankingsPublicationService } from './publication.service';
import { VRRankingsPublication } from './publication.entity';
import moment = require('moment');
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('VRRankingsPublication')
export class VRRankingsPublicationController {
  constructor(private readonly vrrankingspublicationService: VRRankingsPublicationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<VRRankingsPublication[]> {
    return await this.vrrankingspublicationService.findAll();
  }

  @Get('/code/:code')
  @UseGuards(JwtAuthGuard)
  async findBycode(@Param() params): Promise<VRRankingsPublication> {
    return await this.vrrankingspublicationService.findByCode(params.code);
  }

  @Get('/list/')
  // @UseGuards(JwtAuthGuard)
  async getRankingList(@Query() params): Promise<any> {
    // the date query parameter tells us the date year and week we are interested in
    const d = moment(params.date);
    // the minAge query parameter tells us a lower bound on the age of the players to
    // return.  This allows us to implement the 11-12, 13-14, 15-16 and 17-18
    // age groups for Quebec.
    const minAge = (params.minAge) ? parseInt(params.minAge, 10) : 0;
    // the province query parameter just filters to players from a given province.
    const prov = (params.province) ? params.province : '%';
    return await this.vrrankingspublicationService.getRankingList(
      params.code, d.year(), d.isoWeek(), minAge, prov);
  }

  @Get('/WhatsBeenLoaded')
  // @UseGuards(JwtAuthGuard)
  async getLoadedRankingsData(): Promise<any[]> {
    return await this.vrrankingspublicationService.getLoadedRankingsData();
  }
}
