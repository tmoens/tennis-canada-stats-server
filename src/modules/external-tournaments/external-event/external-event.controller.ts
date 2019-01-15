import {Controller, Get, UseGuards} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {ExternalEventService} from './external-event.service';
import {ExternalEvent} from './external-event.entity';

@Controller('ExternalEvent')
export class ExternalEventController {
  constructor(
    private readonly service: ExternalEventService,
  ) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<ExternalEvent[]> {
    return await this.service.findAll();
  }
}
