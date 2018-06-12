import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsCategory } from './category.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {VRRankingsPublication} from "../publication/publication.entity";
import {VRRankingsItemService} from "../item/item.service";
import {VRRankingsType} from "../type/type.entity";

const UPDATE_COUNT = "vrrankingscategory_update";

const logger = getLogger("VRRankingCategoryService");

@Injectable()
export class VRRankingsCategoryService {
  constructor(
    @InjectRepository(VRRankingsCategory)
    private readonly repository: Repository<VRRankingsCategory>,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,
    private readonly rankItemService: VRRankingsItemService,
  ) {}

  async findAll(): Promise<VRRankingsCategory[]> {
    return await this.repository.find();
  }

  // Not really updating the rankings categories in a rankings type - those are fixed.
  // Actually asking to load all the ranking data for all the categories
  // in a given publication run.
  async importVRRankingsCategoriesFromVR(rt:VRRankingsType, publication:VRRankingsPublication): Promise<boolean> {
    let categories:VRRankingsCategory[] = await rt.vrRankingsCategories;
    let category:VRRankingsCategory;
    for (let i=0 ; i < categories.length; i++) {
      category = categories[i];
      if (category.loadMe) {
        logger.info("\tLoading category: " + category.categoryId);
        await this.rankItemService.importVRRankingsListFromVR(publication, category);
      }
    }
    return true;
  }

  // This is done only when starting with a fresh database
  // in practical terms it just helps during development and is
  // never called when the system is live.
  async loadCategories(rt:VRRankingsType,categoryData:any[]) {
    let c:VRRankingsCategory;
    let data:any;
    for (let i=0; i < categoryData.length; i++) {
      data = categoryData[i];
      c = new VRRankingsCategory(
        data.categoryCode,
        rt,
        data.categoryId,
        data.categoryName,
        data.loadme);
      this.repository.save(c);
      rt.vrRankingsCategories.push(c);
    }
  }
}