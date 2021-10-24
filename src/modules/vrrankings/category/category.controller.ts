import {Controller, Get, Param, UseGuards} from '@nestjs/common';
import { VRRankingsCategoryService } from './category.service';
import { VRRankingsCategory } from './category.entity';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('VRRankingsCategory')
export class VRRankingsCategoryController {
  constructor(private readonly vrrankingscategoryService: VRRankingsCategoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.vrrankingscategoryService.findAll();
  }
}
