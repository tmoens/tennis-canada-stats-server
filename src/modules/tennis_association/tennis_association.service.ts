import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TennisAssociation } from './tennis_association.entity'
import {Injectable} from '@nestjs/common';


@Injectable()
export class TennisAssociationService {
  constructor(
    @InjectRepository(TennisAssociation)
    private readonly repository: Repository<TennisAssociation>,
    )
  {  }

  async findAll(): Promise<TennisAssociation[]> {
    return await this.repository.find();
  }

  async validRegionAbbrv(regionAbbrv: string): Promise<boolean> {
    const tennisAssociation = await this.repository.findOne({where: {'regionAbbrv': regionAbbrv}});
    return !!tennisAssociation;
  }
}
