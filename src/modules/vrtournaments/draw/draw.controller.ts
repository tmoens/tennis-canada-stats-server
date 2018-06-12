import { Controller, Get } from '@nestjs/common';
import { DrawService } from './draw.service';
import { Draw } from './draw.entity';

@Controller('Draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}


  @Get()
  async findAll(): Promise<Draw[]> {
    return await this.drawService.findAll();
  }
}
