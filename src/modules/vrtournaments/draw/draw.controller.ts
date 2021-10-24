import {Controller, Get, UseGuards} from '@nestjs/common';
import { DrawService } from './draw.service';
import { Draw } from './draw.entity';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('Draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<Draw[]> {
    return await this.drawService.findAll();
  }
}
