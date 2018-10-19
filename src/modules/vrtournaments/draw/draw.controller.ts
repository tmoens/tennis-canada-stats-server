import {Controller, Get, UseGuards} from '@nestjs/common';
import { DrawService } from './draw.service';
import { Draw } from './draw.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('Draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<Draw[]> {
    return await this.drawService.findAll();
  }
}
