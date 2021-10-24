import {Controller, Get, UseGuards} from '@nestjs/common';
import { VRRankingsTypeService } from './type.service';
import { VRRankingsType } from './type.entity';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('VRRankingsType')
export class VRRankingsTypeController {
  constructor(private readonly vrrankingstypeService: VRRankingsTypeService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<VRRankingsType[]> {
    return await this.vrrankingstypeService.findAll();
  }

  @Get('/import/status')
  @UseGuards(JwtAuthGuard)
  importVRPersonsStatus(): any {
    return this.vrrankingstypeService.getImportStatus();
  }

  @Get('/import')
  @UseGuards(JwtAuthGuard)
  async importRankingsFromVR(): Promise<any> {
    return await this.vrrankingstypeService.importVRRankingsFromVR();
  }
}
