import {Controller, Get, Param, UseGuards} from '@nestjs/common';
import { VRRankingsCategoryService } from './category.service';
import { VRRankingsCategory } from './category.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('VRRankingsCategory')
export class VRRankingsCategoryController {
  constructor(private readonly vrrankingscategoryService: VRRankingsCategoryService) {}

  @Get()
  // @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.vrrankingscategoryService.findAll();
  }

}
