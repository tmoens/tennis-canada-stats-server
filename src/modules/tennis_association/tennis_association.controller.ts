import {Controller, Get, UseGuards} from '@nestjs/common';
import { TennisAssociationService} from './tennis_association.service';
import { TennisAssociation} from './tennis_association.entity';
import {AuthGuard} from '@nestjs/passport';

@Controller('TennisAssociation')
export class TennisAssociationController {
  constructor(private readonly tennisAssociationService: TennisAssociationService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<TennisAssociation[]> {
    return await this.tennisAssociationService.findAll();
  }
}
