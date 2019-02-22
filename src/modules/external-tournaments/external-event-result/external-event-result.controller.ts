import {Body, Controller, Get, Post, Query, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ExternalEventResultService} from './external-event-result.service';
import {ExternalEventResult} from './external-event-result.entity';
import {ExternalEventResultDTO} from './external-event-result.dto';

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

  @Post('overrideExternalPoints')
  @UseGuards(AuthGuard('bearer'))
  async overrideExternalPoints(@Body() externalEventResultDTO: ExternalEventResultDTO): Promise<any> {
    return await this.service.overrideExternalPoints(externalEventResultDTO);
  }
}
