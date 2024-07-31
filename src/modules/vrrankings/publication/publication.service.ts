import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {VRRankingsPublication} from './publication.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {getLogger} from 'log4js';
import {VRRankingsType} from '../type/type.entity';
import {VRRankingsCategory} from '../category/category.entity';
import {VRRankingsItemService} from '../item/item.service';
import {JobState, JobStats} from '../../../utils/jobstats';
import {ConfigurationService} from '../../configuration/configuration.service';

// NOTE: There will be many publication objects for a single VR rankings
// publication. VR has one publication per rankings type
// (adult/senior/junior/wheelchair) per week.
// But we break it down to one publication per category per week
// (e.g. 4.5 Men's singles, U16 Girls doubles etc.)\
// So, for us there are 35 Adult, 25 Junior and 65
// Senior rankings publications every week.

const CREATION_COUNT = 'publication_creation';
const UPDATE_COUNT = 'publication_update';
const FIX_COUNT = 'publication_fix';
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

  async findByCategoryYearWeek(
    category: VRRankingsCategory,
    year: number,
    week: number): Promise<VRRankingsPublication> | null {
    return this.repository.findOne(
      {where: {year, week, rankingsCategory: category.categoryCode}});
  }

  // Get a superficial state of the rankings data that has been loaded from VR
  async getLoadedRankingsData(): Promise<any[]> {
    return await this.repository.createQueryBuilder('rp')
      .select('rt.typeName', 'type')
      .addSelect('rp.year', 'year')
      .addSelect('rp.week', 'week')
      .addSelect('COUNT(rp.publicationCode)', 'categoryCount')
      .leftJoin('rp.rankingsCategory', 'rc')
      .leftJoin('rc.vrRankingsType', 'rt')
      .groupBy('rp.publicationCode')
      .orderBy({
        'rt.typeName': 'ASC',
        'rp.year': 'DESC',
        'rp.week': 'DESC'
      })
      .getRawMany();
  }

  // update the ts_stats_server database wrt vr rankings publications for a given ranking Type
  // The types are Adult, Junior, Masters (Seniors) and Wheelchair
  async importVRRankingsPublicationFromVR(rankingType: VRRankingsType): Promise<JobStats>{
    let message: string;
    const importStats: JobStats = new JobStats(`rankingsImport`);

    importStats.setCurrentActivity(`Loading ${rankingType.typeName} publications from VR`);
    // Ask the API for a list of vr rankings publications for this type of ranking
    // The publications list goes back 100 weeks.
    const pubs_json = await this.vrapi.get('Ranking/' + rankingType.typeCode + '/Publication');
    const publicationList = VRAPIService.arrayify(pubs_json.RankingPublication);

    logger.info(publicationList.length + ' publications found for ' + rankingType.typeName);

    // Each element of the list we get back from the API is a record of a particular
    // "publication".  A "publication" is an id for a set of rankings. For example
    // one "publication" would be for ALL the junior categories in week 14 of 2022.
    // Another would be for ALL the wheelchair categories in week 51 of 2014.
    for (const apiPublication of publicationList) {
      // For a given publication, get a list of all the "sub-publications" in our database.
      // So for the publication for Juniors for week 14 of 2022, there would be
      // a sub-publication for Each junior category (boys singles under 18, mixed doubles
      // under 14, girls doubles under 14, and so on).
      const subPublications: VRRankingsPublication[] =
        await this.repository.find({publicationCode: apiPublication.Code});

      // If we do not already have a record of a particular publication, make one
      // and load the rankings for that publication
      if (0 === subPublications.length) {
        message = `Loading rankings publication: ${apiPublication.Name}`;
        logger.info(message);
        importStats.addNote(message);
        await this.loadVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        importStats.bump(CREATION_COUNT);
      }

      // if our version is out of date, torch it and reload it
      else if (subPublications[0].isOutOfDate(apiPublication.GeneratedDate)) {
        message = `Updating rankings publication: ${apiPublication.Name}. Rankings generated: ${apiPublication.GeneratedDate}, Local version: ${subPublications[0].tcCreatedAt.toLocaleString()}`;
        logger.info(message);
        importStats.addNote(message);
        for (const outdatedPub of subPublications) {
          await this.repository.remove(outdatedPub);
        }
        await this.loadVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        importStats.bump(UPDATE_COUNT);
      }

      // *sometimes* the rankings loader dies on the AWS server because
      // of an OS bug. For example, it might die after loading U16 Girls Singles
      // and just before the U14 Boys Singles.
      // In such a situation, the strength report and historical rankings
      // for that week would be broken.
      // So we take a remedial action here - if we have not loaded every category
      // for a particular publication, we delete all the categories of that
      // publication and re-load it.
      else if (rankingType.vrRankingsCategories.length !== subPublications.length) {
        message = 'Detected incomplete rankings upload for: ' +
          rankingType.typeName + ' for ' + subPublications[0].year + ' week: ' +
          subPublications[0].week + '. Expected ' + rankingType.vrRankingsCategories.length +
          ' categories, found ' + subPublications.length + '. Reloading this publication.';
        logger.info(message);
        importStats.addNote(message);
        for (const brokenPub of subPublications) {
          await this.repository.remove(brokenPub);
        }
        await this.loadVRRankingsPublicationFromVRAPI(rankingType, apiPublication);
        importStats.bump(FIX_COUNT);
      }

      // the normal case: our version is up-to-date, and we can skip along.
      else {
        importStats.bump(UP_TO_DATE_COUNT);
      }

      // Rate limiting so as not to stress the VRAPI when we are first loading up rankings.
      if (this.config.rankingUploadLimit <= importStats.get(CREATION_COUNT)) {
        importStats.addNote(
          `Import limit of ${this.config.rankingUploadLimit} reached for importing ${rankingType.typeName} rankings`);
        break;
      }
    }
    importStats.setCurrentActivity('Finished');
    importStats.setStatus(JobState.DONE);
    logger.info(`Finished loading publications found for ${rankingType.typeName}.` );
    return importStats;
  }

  async loadVRRankingsPublicationFromVRAPI(rankingType: VRRankingsType, apiPublication: any): Promise<boolean> {
    let p = new VRRankingsPublication();

    // We are going to build a separate publication object for each rankings
    // category in the rankings type.
    const categories: VRRankingsCategory[] = rankingType.vrRankingsCategories;
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

  // Find a rankings list for a particular category , year and week
  // in some cases we filter out players below a minimum age to support
  // Quebec's strict age groups like 14-15 instead of U16
  async getRankingList(
    code: string,
    year: number,
    isoWeek: number,
    minAge: number,
    prov: string): Promise<any> {
    // figure out the minimum date of birth of players to be included in the list
    const maxDOB = (year - 1 - minAge).toString() + '-12-31';
    // Find the publication
    let publication: VRRankingsPublication = await this.repository.createQueryBuilder('p')
      .where('p.year = :year', {year})
      .andWhere('p.week = :week', {week: isoWeek})
      .andWhere('p.categorycode = :code', {code})
      .leftJoinAndSelect('p.rankingsCategory', 'c')
      .leftJoinAndSelect('c.vrRankingsType', 't')
      .getOne();

    // if you don't find one, try to find the most recent one instead
    if (!publication) {
      publication = await this.repository.createQueryBuilder('p')
        .where('p.categorycode = :code', {code})
        .leftJoinAndSelect('p.rankingsCategory', 'c')
        .leftJoinAndSelect('c.vrRankingsType', 't')
        .orderBy({'p.year': 'DESC', 'p.week': 'DESC'})
        .getOne();
    }

    // Find the players on the list (skipping those who do not meet the age and province criteria)
    if (publication) {
      const list: any[] =
        await this.vrRankingsItemService.findByPub(publication.publicationId, maxDOB, prov);
      return {publication, list};
    } else {
      return {publication: {}, list: {}};
    }
  }
}
