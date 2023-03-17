import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {ExternalTournament} from './external-tournament.entity';
import {Repository} from 'typeorm';
import {getLogger} from 'log4js';
import {ExternalEventService} from '../external-event/external-event.service';

@Injectable()
export class ExternalTournamentService {
  constructor(
    @InjectRepository(ExternalTournament)
    private readonly repo: Repository<ExternalTournament>,
    private readonly externalEventService: ExternalEventService,
  ) {}

  async findAll(): Promise<ExternalTournament[]> {
    return await this.repo.find();
  }

  /**
   * We have a bunch of result data for a specific tournament for a specific player from
   * the ITF API. Create or update the tournament.
   * @param resultData
   */
  async loadFromITFAPI(resultData: any ): Promise<ExternalTournament> {
    let t: ExternalTournament = await this.repo.findOne(resultData.TournamentId);
    if (!t) {
      t = await this.repo.create({tournamentId: resultData.TournamentId});
    }
    this.updateFromITFAPI(t, resultData);
    return await this.repo.save(t);
  }

  async updateFromITFAPI(t: ExternalTournament, d: any) {
    const logger = getLogger('itfapi');
    if (d.EndDate) t.endDate = d.EndDate.substr(0, 10);
    if (d.StartDate) t.startDate = d.StartDate.substr(0, 10);

    // After 2018 - we care a lot less about sub categories as we have switched to
    // a simple "exchange rate" method of of awarding canadian ranking points.
    // The new method does not care about Categories and subCategories of the tournament,
    // only the points earned by the player.
    const after2018: boolean = ('2018' < t.endDate.substr(0, 4));

    // In 2019, we had the introduction of the ITF Transition tour which awarded
    // its own points which we had to convert.  This ended as quickly as it began.
    const after2019: boolean = ('2019' < t.endDate.substr(0, 4));

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
    switch (d.TournamentId.substr(0, 1)) {
      // Start with Professional Men
      case 'M':
        t.sanctioningBody = 'ATP';
        switch (d.Category) {
          case 'ITF':
            // ITF events are sanctioned by the ITF, not the ATP
            t.sanctioningBody = 'ITF';
            if (after2018 && !after2019) {
              // The transition Tour existed in 2019 only
              // They awarded their own points (not ATP points)
              t.category = 'TT';
              t.subCategory = 'TT';
            } else {
              // before and after that they awarded ATP points, and are pro tournaments.
              t.category = 'Pro';
              t.subCategory = 'Pro';
            }
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
            if (after2018) t.subCategory = 'Challenger';
            break;
          case 'FU':
            // API does not distinguish subCategories
            t.category = 'Futures';
            if (after2018) t.subCategory = 'Futures';
            break;
          case 'TC':
            // I think this is the ATP Cup
            // API does not distinguish subCategories
            t.category = 'TC';
            t.subCategory = 'TC';
            break;
          default:
            logger.error('Failed to interpret tournament category from ITF API: ' + JSON.stringify(d, null, 2));
            break;
        }
        break;
      case 'W':
        // The following is not strictly true as some women's pro events are sanctioned by the ITF.
        t.sanctioningBody = 'WTA';
        switch (d.Category) {
          case 'ITF':
            t.sanctioningBody = 'ITF';
            if (after2018 && !after2019) {
              // The ITF Transition Tour existed only in 2019.

              // There is a problem right here.  The ITF offers two flavours
              // of women's pro events.  "Pro" events that offer WTA points and
              // "Transition Tour" events that offer ITF Entry points.
              // The API does not distinguish between the two and so we call them
              // all TT by default.
              // Then there is a whole user app to change some of them to "Pro" category manually.
              // Soooo, if a user has changed the category of an event from TT to Pro, do not overwrite it.
              if (!t.category || t.category !== 'Pro') {
                t.category = 'TT';
                t.subCategory = 'TT';
              } else {
                // The transition tour was gone in 2020 and the $15K and $20K events reverted
                // to awarding WTA Points.  I.e. ITF Pro events.
                t.category = 'Pro';
                t.subCategory = 'Pro';
              }
            }
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
          case 'WITF':
            // API does not distinguish subCategories
            // Category went away altogether in 2019.
            t.category = 'WITF';
            if (after2018) {
              t.subCategory = 'WITF';
            }
            break;
          default:
            logger.error('Failed to interpret tournament category from ITF API: ' + JSON.stringify(d, null, 2));
            break;
        }
        break;
      case 'J':
        t.sanctioningBody = 'ITF';
        switch (d.Category) {
          case 'GA':
            // API does not distinguish subCategories
            t.category = 'Grade A';
            if (after2018) {
              t.subCategory = 'Grade A';
            }
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
            if (after2018) {
              t.subCategory = 'J500';
            }
            break;
          case 'J300':
            // formerly Grades B1 and 1
            t.category = 'J300';
            if (after2018) {
              t.subCategory = 'J300';
            }
            break;
          case 'J200':
            // formerly grade 2
            t.category = 'J200';
            if (after2018) {
              t.subCategory = 'J200';
            }
            break;
          case 'J100':
            // formerly grade 3
            t.category = 'J100';
            if (after2018) {
              t.subCategory = 'J100';
            }
            break;
          case 'J60':
            // formerly grade 4
            t.category = 'J60';
            if (after2018) {
              t.subCategory = 'J60';
            }
            break;
          case 'J30':
            // formerly grade 5
            t.category = 'J30';
            if (after2018) {
              t.subCategory = 'J30';
            }
            break;
          default:
            logger.error('Failed to interpret tournament category from ITF API: ' + JSON.stringify(d, null, 2));
            break;
        }
        break;
      default:
        logger.error('Failed to identify tournament sanctioning body from: ' + JSON.stringify(d, null, 2));
        break;
    }

  }

// The client has asked for a filtered set of tournaments using an HTTP get query.
// The query contains a number of possible fields which are converted to an sql query.
  async getFilteredTournaments(query: any): Promise<ExternalTournament[] | null> {
    let q = this.repo.createQueryBuilder('t');
    if (query.sanctioningBody) {
      q = q.andWhere('t.sanctioningBody = :sb', {sb: query.sanctioningBody});
    } else {
      q = q.where('1');
    }
    if (query.startPeriod) {
      q = q.andWhere('t.endDate >= :sp', {sp: query.startPeriod});
    }
    if (query.endPeriod) {
      q = q.andWhere('t.endDate <= :ep', {ep: query.endPeriod});
    }
    if (query.tournamentName) {
      q = q.andWhere('t.name LIKE :tn', {tn: '%' + query.tournamentName + '%'});
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
    const t = await this.repo.findOne(tournamentId, {relations: ['externalEvents']});
    if (!t) {
      // TODO should throw exception
      return false;
    }
    t.category = category;
    await this.repo.save(t);
  }
}
