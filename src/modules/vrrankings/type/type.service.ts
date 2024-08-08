import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from 'log4js';
import { VRRankingsType } from './type.entity';
import { VRRankingsPublicationService } from '../publication/publication.service';
import { Injectable } from '@nestjs/common';
import { JobState, JobStats } from '../../../utils/jobstats';

const logger = getLogger('vrrankingstypeService');

@Injectable()
export class VRRankingsTypeService {
  private rankingsImportStats: JobStats;

  constructor(
    @InjectRepository(VRRankingsType)
    private readonly repository: Repository<VRRankingsType>,
    private readonly publicationService: VRRankingsPublicationService,
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
    // go get the known rankings types
    const rankingTypes: VRRankingsType[] = await this.repository.find({
      relations: ['vrRankingsCategories'],
    });
    for (const rankingType of rankingTypes) {
      const typeStats: JobStats =
        await this.publicationService.importVRRankingsPublicationFromVR(
          rankingType,
        );
      this.rankingsImportStats.merge(typeStats);
    }
    this.rankingsImportStats.setStatus(JobState.DONE);
    logger.info('**** VR Ranking Import done.');
  }

  getImportStatus(): JobStats {
    return this.rankingsImportStats;
  }
}
