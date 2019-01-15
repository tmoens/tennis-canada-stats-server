import {Controller, Get, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ExternalEventResultDTO, ExternalEventResultService} from './external-event-result.service';
import {ExternalEventResult} from './external-event-result.entity';

@Controller('ExternalEventResult')
export class ExternalEventResultController {
  constructor(
    private readonly service: ExternalEventResultService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<ExternalEventResult[]> {
    return await this.service.findAll();
  }

  @Get('getFilteredResults')
  @UseGuards(AuthGuard('bearer'))
  async getFilteredTournaments(@Query() query): Promise<ExternalEventResultDTO[] | null> {
    return await this.service.getFilteredResults(query);
  }
}
