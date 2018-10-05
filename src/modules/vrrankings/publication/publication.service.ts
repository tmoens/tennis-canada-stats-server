import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VRRankingsPublication } from './publication.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {getLogger} from 'log4js';
import {VRRankingsType} from '../type/type.entity';
import {VRRankingsCategory} from '../category/category.entity';
import {VRRankingsItemService} from '../item/item.service';
import {JobStats} from '../../../utils/jobstats';
import {ConfigurationService} from '../../configuration/configuration.service';

const CREATION_COUNT = 'publication_creation';
const UPDATE_COUNT = 'publication_update';
const UP_TO_DATE_COUNT = 'publication_up_to_date';

const logger = getLogger('VRRankingsPublicationService');

@Injectable()
export class VRRankingsPublicationService {
   constructor(
    private readonly config: ConfigurationService,
    @InjectRepository(VRRankingsPublication)
    private readonly repository: Repository<VRRankingsPublication>,
    private readonly vrapi: VRAPIService,
    private readonly vrRankingsItemService: VRRankingsItemService,
  ) {}

  async findAll(): Promise<VRRankingsPublication[]> {
    return await this.repository.find();
  }

  async findByCode(publicationCode: string): Promise<VRRankingsPublication> {
    return await this.repository.findOne({publicationCode});
  }

  // update the ts_stats_server database wrt vrrankingspublications for a given ranking Type
  async importVRRankingsPublicationFromVR(rankingType: VRRankingsType) {
    const importStats: JobStats = new JobStats(`rankingsImport`)

    // Ask the API for a list of vr rankings publications for this type of ranking
    let list = await this.vrapi.get('Ranking/' + rankingType.typeCode + '/Publication');

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of RankingPublication s if there is more than one.
    // We want an array regardless of whether the rankings list has 0, 1 or more items
    if (null == list.RankingPublication) {
      list = [];
    } else if (Array.isArray(list.RankingPublication)) {
      list = list.RankingPublication;
    } else {
      list = [list.RankingPublication];
    }

    logger.info(list.length + ' publications found for ' + rankingType.typeName);

    let apiPublication: any;
    for (apiPublication of list) {
      // If we do not already have a record of the vrrankingspublicationId, make one
      const publication: VRRankingsPublication =
        await this.repository.findOne({publicationCode: apiPublication.Code});
      if (null == publication) {
        logger.info('Loading rankings publication: ' + apiPublication.Name);
        await this.loadVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        importStats.bump(CREATION_COUNT);
      }

      // if our version is out of date, torch it and rebuild
      else if (publication.isOutOfDate(apiPublication.PublicationDate)) {

        logger.info('Updating rankings publication: ' + apiPublication.Name);
        // There will be many publication objects for a single VR rankings publication
        // Because VR has one publication per rankings type
        // (adult/senior/junior/wheelchair) per week,
        // but we break it down to one publication per category per week
        // (e.g. 4.5 Men's singles, U16 Girls doubles etc)
        const outdatedPublications: VRRankingsPublication[] =
          await this.repository.find({publicationCode: apiPublication.Code});
        for (const outdatedPub of outdatedPublications) {
          await this.repository.remove(outdatedPub);
        }
        await this.loadVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        importStats.bump(UPDATE_COUNT);
      }

      // TODO *could* check that there are the right number of ranking lists
      // for this publication of this rankings type as it has been known
      // to happen that a rankings list import gets interrupted.

      // otherwise, our version is up to date and we can skip along.
      else {
        importStats.bump(UP_TO_DATE_COUNT);
      }

      if (this.config.rankingUploadLimit <= importStats.get(CREATION_COUNT)) break;
    }
    logger.info('Stats: ' + JSON.stringify(importStats));
    logger.info(`Finished loading publications found for ${rankingType.typeName}.` );
  }

  async loadVRRankingsPublicationFromVRAPI(rankingType: VRRankingsType, apiPublication: any): Promise<boolean> {
    let p = new VRRankingsPublication();

    // We are going to build a separate publication object for each rankings
    // category in the rankings type.
    const categories: VRRankingsCategory[] = await rankingType.vrRankingsCategories;
    let category: VRRankingsCategory;
    for (category of categories) {
      if (category.loadMe) {
        p = new VRRankingsPublication();
        p.buildFromVRAPIObj(apiPublication);
        p.rankingsCategory = category;
        await this.repository.save(p);
        logger.info('\tLoading category: ' + category.categoryId);
        await this.vrRankingsItemService.importVRRankingsListFromVR(p);
      }
    }
    return true;
  }
}
