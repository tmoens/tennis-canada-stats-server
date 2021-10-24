import {Body, Controller, Get, Post, Query, UseGuards} from '@nestjs/common';
import {ExternalEventResultService} from './external-event-result.service';
import {ExternalEventResult} from './external-event-result.entity';
import {ExternalEventResultDTO} from './external-event-result.dto';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('ExternalEventResult')
export class ExternalEventResultController {
  constructor(
    private readonly service: ExternalEventResultService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ExternalEventResult[]> {
    return await this.service.findAll();
  }

  @Get('getFilteredResults')
  @UseGuards(JwtAuthGuard)
  async getFilteredTournaments(@Query() query): Promise<ExternalEventResultDTO[] | null> {
    return await this.service.getFilteredResults(query);
  }

  @Post('overrideExternalPoints')
  @UseGuards(JwtAuthGuard)
  async overrideExternalPoints(@Body() externalEventResultDTO: ExternalEventResultDTO): Promise<any> {
    return await this.service.overrideExternalPoints(externalEventResultDTO);
  }
}
