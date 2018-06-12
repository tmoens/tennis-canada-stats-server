import {Controller, Get, Param} from '@nestjs/common';
import { VRRankingsCategoryService } from './category.service';
import { VRRankingsCategory } from './category.entity';
import {VRRankingsPublication} from "../publication/publication.entity";

@Controller('VRRankingsCategory')
export class VRRankingsCategoryController {
  constructor(private readonly vrrankingscategoryService: VRRankingsCategoryService) {}


  @Get()
  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.vrrankingscategoryService.findAll();
  }

}
