import { Controller, Get } from '@nestjs/common';
import { TennisAssociationService} from './tennis_association.service';
import { TennisAssociation} from './tennis_association.entity';

@Controller('TennisAssociation')
export class TennisAssociationController {
  constructor(private readonly tennisAssociationService: TennisAssociationService) {}

  @Get()
  async findAll(): Promise<TennisAssociation[]> {
    return await this.tennisAssociationService.findAll();
  }
}
