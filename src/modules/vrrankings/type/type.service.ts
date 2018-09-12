import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {getLogger} from "log4js";
import { VRRankingsType } from './type.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {VRRankingsPublicationService} from "../publication/publication.service";
import {Injectable} from "@nestjs/common";
import {INITIAL_TYPES_AND_CATEGORIES} from "./initial_types_and_categories";
import {VRRankingsCategoryService} from "../category/category.service";
import {JobStats, JobState} from "../../../utils/jobstats";

const UPDATE_COUNT = "vrrankingstype_update";

const logger = getLogger("vrrankingstypeService");

@Injectable()
export class VRRankingsTypeService {
  importStats: JobStats;
  constructor(
    @InjectRepository(VRRankingsType)
    private readonly repository: Repository<VRRankingsType>,
    private readonly vrapi: VRAPIService,
    private readonly publicationService: VRRankingsPublicationService,
    private readonly rankingsCategoryService: VRRankingsCategoryService,
  ) {
    this.importStats = new JobStats("Rankings import");
  }

  async findAll(): Promise<VRRankingsType[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database rankings.
  // The rankings type is the top of the food chain,
  // go load publications for each ranking type
  async importVRRankingsFromVR() {
    this.importStats = new JobStats("Rankings import");
    this.importStats.setStatus(JobState.IN_PROGRESS);

    // go get the the known rankings types
    let rankingTypes:VRRankingsType[] = await this.repository.find({relations: ["vrRankingsCategories"]});
    for (let i = 0; i < rankingTypes.length; i++) {
      await this.publicationService.importVRRankingsPublicationFromVR(rankingTypes[i], this.importStats);
      this.importStats.bump(UPDATE_COUNT);
    }
    this.importStats.setStatus(JobState.DONE);
    return JSON.stringify(this.importStats);
  }

  // If there are no rankings types and categories, load them.
  async loadInitialRankingsTypes(): Promise<any> {
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
        await this.rankingsCategoryService.loadCategories(rt,data.categories);
        logger.info("Done loading ranking types and categories for " + data.typeName);
      }
    }
    return true;
  }
}
