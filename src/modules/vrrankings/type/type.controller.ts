import { Controller, Get } from '@nestjs/common';
import { VRRankingsTypeService } from './type.service';
import { VRRankingsType } from './type.entity';

@Controller('VRRankingsType')
export class VRRankingsTypeController {
  constructor(private readonly vrrankingstypeService: VRRankingsTypeService) {}

  @Get()
  async findAll(): Promise<VRRankingsType[]> {
    return await this.vrrankingstypeService.findAll();
  }

  @Get('/import')
  async importRankingsFromVR(): Promise<any> {
    return await this.vrrankingstypeService.importVRRankingsFromVR();
  }
}
