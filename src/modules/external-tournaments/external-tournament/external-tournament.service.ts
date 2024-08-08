import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExternalTournament } from './external-tournament.entity';
import { Repository } from 'typeorm';
import { getLogger } from 'log4js';

@Injectable()
export class ExternalTournamentService {
  constructor(
    @InjectRepository(ExternalTournament)
    private readonly repo: Repository<ExternalTournament>,
  ) {}

  async findAll(): Promise<ExternalTournament[]> {
    return await this.repo.find();
  }

  /**
   * We have a bunch of result data for a specific tournament for a specific player from
   * the ITF API. Create or update the tournament.
   * @param resultData
   */
  async loadFromITFAPI(resultData: any): Promise<ExternalTournament> {
    let t: ExternalTournament = await this.repo.findOne({
      where: {
        tournamentId: resultData.TournamentId,
      },
    });
    if (!t) {
      t = this.repo.create({ tournamentId: resultData.TournamentId });
    }
    await this.updateFromITFAPI(t, resultData);
    return await this.repo.save(t);
  }

  async updateFromITFAPI(t: ExternalTournament, d: any) {
    const logger = getLogger('itfapi');
    if (d.EndDate) t.endDate = d.EndDate.slice(0, 10);
    if (d.StartDate) t.startDate = d.StartDate.slice(0, 10);

    t.hostNation = d.HostNation;
    t.name = d.PromoName;
    t.zone = d.Zone;

    // The ITF API does not specify the sanctioning body for a tournament.
    // However, it does provide a tournament ID in which the first character
    // is J for Junior, M for Male Pro events (ATP) or W for Female Pro events (WTA)

    // The ITF API provides a Category Code which we translate into a Category name
    // The ITF does not provide the sub-category, so when it is ambiguous,
    // a user will have to set the sub category (later).
    // For example the API does not distinguish between the various type
    // of Futures or Challenger events.
    switch (d.TournamentId.slice(0, 1)) {
      // Start with Professional Men
      case 'M':
        t.sanctioningBody = 'ATP';
        switch (d.Category) {
          case 'ITF':
            // ITF events are sanctioned by the ITF, not the ATP
            t.sanctioningBody = 'ITF';
            t.category = 'Pro';
            t.subCategory = 'Pro';
            break;
          case 'OL':
            // No sub categories
            t.category = 'Olympics';
            t.subCategory = 'Olympics';
            break;
          case 'SL':
            // No sub categories
            t.category = 'Grand Slam';
            t.subCategory = 'Grand Slam';
            break;
          case '1000':
            // No sub categories
            t.category = 'ATP 1000';
            t.subCategory = 'ATP 1000';
            break;
          case '500':
            // No sub categories
            t.category = 'ATP 500';
            t.subCategory = 'ATP 500';
            break;
          case '250':
            // No sub categories
            t.category = 'ATP 250';
            t.subCategory = 'ATP 250';
            break;
          case 'CH':
            // API does not distinguish subCategories
            t.category = 'Challenger';
            t.subCategory = 'Challenger';
            break;
          case 'FU':
            // API does not distinguish subCategories
            t.category = 'Futures';
            t.subCategory = 'Futures';
            break;
          case 'TC':
            // I think this is the ATP Cup
            // API does not distinguish subCategories
            t.category = 'TC';
            t.subCategory = 'TC';
            break;
          default:
            logger.error(
              'Failed to interpret tournament category from ITF API: ' +
                JSON.stringify(d, null, 2),
            );
            break;
        }
        break;
      case 'W':
        // The following is not strictly true as some women's pro events are sanctioned by the ITF.
        t.sanctioningBody = 'WTA';
        switch (d.Category) {
          case 'ITF':
            // ITF events are sanctioned by the ITF, not the WTA
            t.sanctioningBody = 'ITF';
            t.category = 'Pro';
            t.subCategory = 'Pro';
            break;
          case 'OL':
            // No sub categories
            t.category = 'Olympics';
            t.subCategory = 'Olympics';
            break;
          case 'SL':
            // No sub categories
            t.category = 'Grand Slam';
            t.subCategory = 'Grand Slam';
            break;
          case 'WTF':
            // No sub categories
            t.category = 'WTA Finals';
            t.subCategory = 'WTA Finals';
            break;
          case 'PM':
            // No sub categories
            t.category = 'Premier Mandatory';
            t.subCategory = 'Premier Mandatory';
            break;
          case 'P5':
            // No sub categories
            t.category = 'Premier 5';
            t.subCategory = 'Premier 5';
            break;
          case 'P700':
            // No sub categories
            t.category = 'Premier 700';
            t.subCategory = 'Premier 700';
            break;
          case 'W1000':
            // No sub categories
            t.category = 'WTA 1000 Series';
            t.subCategory = 'WTA 1000 Series';
            break;
          case 'W500':
            // No sub categories
            t.category = 'WTA W500 Series';
            t.subCategory = 'WTA W500 Series';
            break;
          case 'W250':
            // No sub categories
            t.category = 'WTA 250 Series';
            t.subCategory = 'WTA 250 Series';
            break;
          case 'W125':
            // No sub categories
            t.category = 'WTA 125K Series';
            t.subCategory = 'WTA 125K Series';
            break;
          case 'INT':
            // No sub categories
            t.category = 'WTA International';
            t.subCategory = 'WTA International';
            break;
          default:
            logger.error(
              'Failed to interpret tournament category from ITF API: ' +
                JSON.stringify(d, null, 2),
            );
            break;
        }
        break;
      case 'J':
        t.sanctioningBody = 'ITF';
        switch (d.Category) {
          case 'GA':
            // API does not distinguish subCategories
            t.category = 'Grade A';
            t.subCategory = 'Grade A';
            break;
          case 'GB1':
            // No sub categories
            t.category = 'Grade B1';
            t.subCategory = 'Grade B1';
            break;
          case 'G1':
            // No sub categories
            t.category = 'Grade 1';
            t.subCategory = 'Grade 1';
            break;
          case 'G2':
            // No sub categories
            t.category = 'Grade 2';
            t.subCategory = 'Grade 2';
            break;
          case 'G3':
            // No sub categories
            t.category = 'Grade 3';
            t.subCategory = 'Grade 3';
            break;
          case 'G4':
            // No sub categories
            t.category = 'Grade 4';
            t.subCategory = 'Grade 4';
            break;
          case 'G5':
            // No sub categories
            t.category = 'Grade 5';
            t.subCategory = 'Grade 5';
            break;
          case 'J500':
          case 'JGS':
            // Formerly grand slam
            t.category = 'J500';
            t.subCategory = 'J500';
            break;
          case 'J300':
            // formerly Grades B1 and 1
            t.category = 'J300';
            t.subCategory = 'J300';
            break;
          case 'J200':
            // formerly grade 2
            t.category = 'J200';
            t.subCategory = 'J200';
            break;
          case 'J100':
            // formerly grade 3
            t.category = 'J100';
            t.subCategory = 'J100';
            break;
          case 'J60':
            // formerly grade 4
            t.category = 'J60';
            t.subCategory = 'J60';
            break;
          case 'J30':
            // formerly grade 5
            t.category = 'J30';
            t.subCategory = 'J30';
            break;
          default:
            logger.error(
              'Failed to interpret tournament category from ITF API: ' +
                JSON.stringify(d, null, 2),
            );
            break;
        }
        break;
      default:
        logger.error(
          'Failed to identify tournament sanctioning body from: ' +
            JSON.stringify(d, null, 2),
        );
        break;
    }
  }

  // The client has asked for a filtered set of tournaments using an HTTP get query.
  // The query contains a number of possible fields which are converted to a sql query.
  async getFilteredTournaments(
    query: any,
  ): Promise<ExternalTournament[] | null> {
    let q = this.repo.createQueryBuilder('t');
    if (query.sanctioningBody) {
      q = q.andWhere('t.sanctioningBody = :sb', { sb: query.sanctioningBody });
    } else {
      q = q.where('1');
    }
    if (query.startPeriod) {
      q = q.andWhere('t.endDate >= :sp', { sp: query.startPeriod });
    }
    if (query.endPeriod) {
      q = q.andWhere('t.endDate <= :ep', { ep: query.endPeriod });
    }
    if (query.tournamentName) {
      q = q.andWhere('t.name LIKE :tn', {
        tn: '%' + query.tournamentName + '%',
      });
    }
    if (query.category) {
      if (query.category === 'Junior') {
        q = q.andWhere('t.tournamentId LIKE "J"');
      }
      if (query.category === 'Open') {
        if (query.gender) {
          if (query.gender === 'F') {
            q = q.andWhere('t.tournamentId LIKE "W%"');
          }
          if (query.category === 'M') {
            q = q.andWhere('t.tournamentId LIKE "M%"');
          }
        } else {
          q = q.andWhere('t.tournamentId NOT LIKE "J%"');
        }
      }
    }
    return await q.orderBy('t.endDate', 'DESC').getMany();
  }

  // Update the tournament category.
  // Introduced when we could not do it automatically from the ITF API feed.
  // Specifically ITF Women's pro events did not distinguish between pro
  // events that award WTA points and Transition Tour events that offer
  // ITF Entry.
  async updateCategory(tournamentId: string, category: string): Promise<any> {
    const t = await this.repo.findOne({
      where: {
        tournamentId,
      },
      relations: {
        externalEvents: true,
      },
    });
    if (!t) {
      // TODO should throw exception
      return false;
    }
    t.category = category;
    await this.repo.save(t);
  }
}
