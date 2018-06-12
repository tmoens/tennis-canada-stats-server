import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {getLogger} from "log4js";
import { VRRankingsType } from './type.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {StatsService} from "../../stats/stats.service";
import {VRRankingsPublicationService} from "../publication/publication.service";
import {Injectable} from "@nestjs/common";
import {INITIAL_TYPES_AND_CATEGORIES} from "./initial_types_and_categories";
import {VRRankingsCategoryService} from "../category/category.service";

const UPDATE_COUNT = "vrrankingstype_update";

const logger = getLogger("vrrankingstypeService");

@Injectable()
export class VRRankingsTypeService {
  constructor(
    @InjectRepository(VRRankingsType)
    private readonly repository: Repository<VRRankingsType>,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,
    private readonly publicationService: VRRankingsPublicationService,
    private readonly rankingsCategoryService: VRRankingsCategoryService,
  ) {}

  async findAll(): Promise<VRRankingsType[]> {
    return await this.repository.find();
  }

  async findByKey(typeCode:string): Promise<VRRankingsType | null> {
    return await this.repository.findOne(typeCode);
  }

  // update the ts_stats_server database rankings.
  // The rankings type is the top of the food chain,
  // go load publications for each ranking type
  async importVRRankingsFromVR() {
    this.statsService.resetAll();
    // go get the the known rankings types
    let rankingType:VRRankingsType;
    let rankingTypes:VRRankingsType[] = await this.repository.find({relations: ["vrRankingsCategories"]});

    for (let i = 0; i < rankingTypes.length; i++) {
      await this.publicationService.importVRRankingsPublicationFromVR(rankingTypes[i]);
      this.statsService.bump(UPDATE_COUNT);
    }
    this.statsService.logAll();
    return this.statsService.get(UPDATE_COUNT);
  }

  // If there are no rankings types and categories, load them.
  async loadInitialRankingsTpes(): Promise<any> {
    let test:VRRankingsType = await this.repository.findOne();
    if (test == null) {
      let rt:VRRankingsType;
      let data: any;
      for (let i = 0; i < INITIAL_TYPES_AND_CATEGORIES.length; i++) {
        data = INITIAL_TYPES_AND_CATEGORIES[i];
        logger.info("Loading ranking types and categories for " +
          data.typeName + "code: " + data.typeCode);
        rt = new VRRankingsType(data.typeCode, data.typeName);
        rt.vrRankingsCategories = [];
        await this.repository.save(rt);
        this.rankingsCategoryService.loadCategories(rt,data.categories);
        logger.info("Done loading ranking types and categories for " + data.typeName);
      }
    }
    return true;
  }
}
