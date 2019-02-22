import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {PointExchange} from './point-exchange.entity';
import {PointExchangeService} from './point-exchange.service';

@Controller('PointExchange')
export class PointExchangeController {
  constructor(
    private readonly service: PointExchangeService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<PointExchange[]> {
    return await this.service.findAll();
  }
}
