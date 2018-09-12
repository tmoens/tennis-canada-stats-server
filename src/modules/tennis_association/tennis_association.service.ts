import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TennisAssociation } from './tennis_association.entity'
import {getLogger} from "log4js";
import {Injectable} from "@nestjs/common";
import {TENNIS_ASSOCIATIONS} from "./initial_tennis_associations";

const logger = getLogger("tennisAssociationService");

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

  async loadTennisAssociations(): Promise<any> {
    let test = await this.repository.findOne();
    if (test == null) {
      logger.info("Loading Tennis Associations");
      for (let i = 0; i < TENNIS_ASSOCIATIONS.length; i++) {
        this.repository.save(TENNIS_ASSOCIATIONS[i]);
      }
      logger.info("Done loading Tennis Associations");
    }
    return true;
  }
}