import {Controller, Get, UseGuards} from '@nestjs/common';
import { VRRankingsTypeService } from './type.service';
import { VRRankingsType } from './type.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('VRRankingsType')
export class VRRankingsTypeController {
  constructor(private readonly vrrankingstypeService: VRRankingsTypeService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<VRRankingsType[]> {
    return await this.vrrankingstypeService.findAll();
  }

  @Get('/import/status')
  @UseGuards(AuthGuard('bearer'))
  importVRPersonsStatus(): any {
    return this.vrrankingstypeService.getImportStatus();
  }

  @Get('/import')
  @UseGuards(AuthGuard('bearer'))
  async importRankingsFromVR(): Promise<any> {
    return await this.vrrankingstypeService.importVRRankingsFromVR();
  }
}
