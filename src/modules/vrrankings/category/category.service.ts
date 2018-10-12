import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsCategory } from './category.entity';
import {getLogger} from 'log4js';
import {VRRankingsType} from '../type/type.entity';

const logger = getLogger('VRRankingCategoryService');

@Injectable()
export class VRRankingsCategoryService {
  constructor(
    @InjectRepository(VRRankingsCategory)
    private readonly repository: Repository<VRRankingsCategory>,
  ) {}

  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.repository.find();
  }

  async getRankingCategoryFromId(catId: string): Promise<VRRankingsCategory> | null {
    return await this.repository.findOne({where: { categoryId: catId}});
  }

  // This is done only when starting with a fresh database
  // in practical terms it just helps during development and is
  // never called when the system is live.
  async loadCategories(rt: VRRankingsType, categoryData: any[]) {
    let c: VRRankingsCategory;
    for (const data of categoryData) {
      c = new VRRankingsCategory(
        data.categoryCode,
        rt,
        data.categoryId,
        data.categoryName,
        data.loadme);
      this.repository.save(c);
    }
    logger.info('Loaded static rankings categories.');
  }
}