import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ItfMatchResultsService} from './itf-match-results.service';
import {ItfMatchResult} from './itf-match-result.entity';

@Controller('ITFMatchResults')
export class ItfMatchResultsController {
  constructor(
    private readonly service: ItfMatchResultsService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<ItfMatchResult[]> {
    return await this.service.findAll();
  }
}
