import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {getLogger} from 'log4js';
import {VRRankingsType} from './type.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {VRRankingsPublicationService} from '../publication/publication.service';
import {Injectable} from '@nestjs/common';
import {INITIAL_TYPES_AND_CATEGORIES} from './initial_types_and_categories';
import {VRRankingsCategoryService} from '../category/category.service';
import {JobState, JobStats} from '../../../utils/jobstats';

const logger = getLogger('vrrankingstypeService');

@Injectable()
export class VRRankingsTypeService {
  private rankingsImportStats: JobStats;

  constructor(
    @InjectRepository(VRRankingsType)
    private readonly repository: Repository<VRRankingsType>,
    private readonly vrapi: VRAPIService,
    private readonly publicationService: VRRankingsPublicationService,
    private readonly rankingsCategoryService: VRRankingsCategoryService,
  ) {
    this.rankingsImportStats = new JobStats(' VR Rankings Import');
  }

  async findAll(): Promise<VRRankingsType[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database rankings.
  // The rankings type is the top of the food chain,
  // go load publications for each ranking type
  async importVRRankingsFromVR() {
    this.rankingsImportStats = new JobStats(' VR Rankings Import');
    this.rankingsImportStats.setStatus(JobState.IN_PROGRESS);
    logger.info('**** VR Ranking Import starting...');
    // go get the the known rankings types
    const rankingTypes: VRRankingsType[] = await this.repository
      .find({relations: ['vrRankingsCategories']});
    for (const rankingType of rankingTypes) {
      const typeStats: JobStats = await this.publicationService.importVRRankingsPublicationFromVR(rankingType);
      this.rankingsImportStats.merge(typeStats);
    }
    this.rankingsImportStats.setStatus(JobState.DONE);
    logger.info('**** VR Ranking Import done.');
  }

  // If there are no rankings types and categories, load them.
  async loadInitialRankingsTypes(): Promise<any> {
    const test: VRRankingsType = await this.repository.findOne();
    if (test == null) {
      let rt: VRRankingsType;
      let data: any;
      for (data of INITIAL_TYPES_AND_CATEGORIES) {
        logger.info('Loading ranking types and categories for ' +
          data.typeName + 'code: ' + data.typeCode);
        rt = new VRRankingsType(data.typeCode, data.typeName);
        rt.vrRankingsCategories = [];
        await this.repository.save(rt);
        await this.rankingsCategoryService.loadCategories(rt, data.categories);
        logger.info('Done loading ranking types and categories for ' + data.typeName);
      }
    }
    return true;
  }

  getImportStatus(): JobStats {
    return this.rankingsImportStats;
  }
}
