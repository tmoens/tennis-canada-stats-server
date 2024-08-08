import { Controller, Get, UseGuards } from '@nestjs/common';
import { ItfMatchResultsService } from './itf-match-results.service';
import { ItfMatchResult } from './itf-match-result.entity';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';

@Controller('ITFMatchResults')
export class ItfMatchResultsController {
  constructor(private readonly service: ItfMatchResultsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ItfMatchResult[]> {
    return await this.service.findAll();
  }
}
