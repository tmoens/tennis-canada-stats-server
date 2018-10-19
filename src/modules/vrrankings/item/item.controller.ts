import {Controller, Get, UseGuards} from '@nestjs/common';
import { VRRankingsItemService } from './item.service';
import { VRRankingsItem } from './item.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('VRRankingsItem')
export class VRRankingsItemController {
  constructor(private readonly vrrankingsitemService: VRRankingsItemService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<VRRankingsItem[]> {
    return await this.vrrankingsitemService.findAll();
  }
}
