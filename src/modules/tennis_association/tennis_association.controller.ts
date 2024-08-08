import { Controller, Get, UseGuards } from '@nestjs/common';
import { TennisAssociationService } from './tennis_association.service';
import { TennisAssociation } from './tennis_association.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('TennisAssociation')
export class TennisAssociationController {
  constructor(
    private readonly tennisAssociationService: TennisAssociationService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<TennisAssociation[]> {
    return await this.tennisAssociationService.findAll();
  }
}
