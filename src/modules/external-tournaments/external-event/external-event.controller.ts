import {Controller, Get, UseGuards} from '@nestjs/common';
import {ExternalEventService} from './external-event.service';
import {ExternalEvent} from './external-event.entity';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('ExternalEvent')
export class ExternalEventController {
  constructor(
    private readonly service: ExternalEventService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<ExternalEvent[]> {
    return await this.service.findAll();
  }
}
