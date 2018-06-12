import { Controller, Get } from '@nestjs/common';
import { VRRankingsItemService } from './item.service';
import { VRRankingsItem } from './item.entity';

@Controller('VRRankingsItem')
export class VRRankingsItemController {
  constructor(private readonly vrrankingsitemService: VRRankingsItemService) {}

  @Get()
  async findAll(): Promise<VRRankingsItem[]> {
    return await this.vrrankingsitemService.findAll();
  }
}
