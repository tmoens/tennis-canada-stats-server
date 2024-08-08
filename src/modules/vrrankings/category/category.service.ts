import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsCategory } from './category.entity';

@Injectable()
export class VRRankingsCategoryService {
  constructor(
    @InjectRepository(VRRankingsCategory)
    private readonly repository: Repository<VRRankingsCategory>,
  ) {}

  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.repository.find();
  }

  // Translate some textual category name like "JFSU12" (that is, Junior Female Singles Under 12)
  // to the appropriate VR rankings category, if at all possible.
  async getRankingCategoryFromId(
    catId: string,
  ): Promise<VRRankingsCategory> | null {
    return await this.repository.findOne({
      where: {
        categoryId: catId,
      },
    });
  }
}
