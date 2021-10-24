import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ItfapiService} from './itfapi.service';
import {JwtAuthGuard} from '../../guards/jwt-auth.guard';

@Controller('ITFAPI')
export class ItfapiController {
  constructor(
    private readonly service: ItfapiService) {
  }

  // This is only for testing.  In production there will be an executable
  // that gets run regularly for loading results from the ITF API
  @Get()
  @UseGuards(JwtAuthGuard)
  async loadResults() {
    return await this.service.loadResults();
  }
}
