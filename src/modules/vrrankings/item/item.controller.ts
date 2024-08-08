import { Controller, Get, UseGuards } from '@nestjs/common';
import { VRRankingsItemService } from './item.service';
import { VRRankingsItem } from './item.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('VRRankingsItem')
export class VRRankingsItemController {
  constructor(private readonly vrrankingsitemService: VRRankingsItemService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<VRRankingsItem[]> {
    return await this.vrrankingsitemService.findAll();
  }
}
