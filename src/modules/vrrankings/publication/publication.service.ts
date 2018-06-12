import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsPublication } from './publication.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {VRRankingsType} from "../type/type.entity";
import {VRRankingsCategoryService} from "../category/category.service";

const CREATION_COUNT = "publication_creation";
const UPDATE_COUNT = "publication_update";
const UP_TO_DATE_COUNT = "publication_up_to_date";

const logger = getLogger("VRRankingsPublicationService");

@Injectable()
export class VRRankingsPublicationService {
  constructor(
    @InjectRepository(VRRankingsPublication)
    private readonly repository: Repository<VRRankingsPublication>,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,
    private readonly categoryService: VRRankingsCategoryService,
  ) {}

  async findAll(): Promise<VRRankingsPublication[]> {
    return await this.repository.find();
  }

  async findByCode(publicationCode:string): Promise<VRRankingsPublication> {
    return await this.repository.findOne({publicationCode: publicationCode});
  }

  // update the ts_stats_server database wrt vrrankingspublications for a given ranking Type
  async importVRRankingsPublicationFromVR(rankingType:VRRankingsType) {
    let publication: VRRankingsPublication;

    // Ask the API for a list of vr rankings publications for this type of ranking
    // The API responds with an array an objects containing only one item called
    // RankingPublication which is an array of vr rankings publication records
    // specific to this type of ranking.
    let apiPublications = await this.vrapi.get("Ranking/" + rankingType.typeCode + "/Publication");
    apiPublications = apiPublications.RankingPublication;
    logger.info(apiPublications.length + " publications found for " + rankingType.typeName);

    for (let i = 0; i < apiPublications.length; i++) {
      let apiPublication = apiPublications[i];
      let pubDate:Date = new Date(apiPublication.PublicationDate);

      // go see if we already have a record of the vrrankingspublicationId.
      // If not make a new one
      let publication:VRRankingsPublication = await
        this.repository.findOne({publicationCode: apiPublication.Code});
      if (null == publication) {
        logger.info("Loading rankings publication: " + apiPublication.Name);
        await this.createVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        this.statsService.bump(CREATION_COUNT);
      }

      // if our version is out of date, torch it and rebuild
      else if (publication.isOutOfDate(apiPublication.PublicationDate)) {
        logger.info("Updating rankings publication: " + apiPublication.Name);
        await this.repository.remove(publication);
        await this.createVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        this.statsService.bump(UPDATE_COUNT);
      }

      // otherwise, our version is up to date and we can skip along.
      else {
        this.statsService.bump(UP_TO_DATE_COUNT);
      }

      if (1 <= this.statsService.get(CREATION_COUNT)) break; // for debugging
    }
  }

  async createVRRankingsPublicationFromVRAPI(rankingType:VRRankingsType,apiPublication: any): Promise<boolean> {
    let p = new VRRankingsPublication();
    p.buildFromVRAPIObj(rankingType, apiPublication);
    await this.repository.save(p);
    await this.categoryService.importVRRankingsCategoriesFromVR(rankingType, p);
    return true;
  }
}

