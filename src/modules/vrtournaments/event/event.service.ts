import {Injectable} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import {Between, EntityManager, Equal, FindConditions, LessThan, MoreThan, Repository} from 'typeorm';
import { Event } from './event.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {Tournament} from '../tournament/tournament.entity';
import {getLogger} from 'log4js';
import {PlayerService} from '../../player/player.service';
import {DrawService} from '../draw/draw.service';
import {JobStats} from '../../../utils/jobstats';
import {utils, WorkBook, WorkSheet, writeFile} from 'xlsx';
import {VRRankingsCategory} from '../../vrrankings/category/category.entity';
import {VRRankingsCategoryService} from '../../vrrankings/category/category.service';
import {VRRankingsPublicationService} from '../../vrrankings/publication/publication.service';
import * as moment from 'moment';
import {arrayify} from "../../../../node_modules/tslint/lib/utils";

const CREATION_COUNT = 'event_creation';
const logger = getLogger('eventService');

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private readonly repository: Repository<Event>,
    private readonly drawService: DrawService,
    private readonly playerService: PlayerService,
    private readonly vrapi: VRAPIService,
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly categoryService: VRRankingsCategoryService,
    private readonly rankingsPubService: VRRankingsPublicationService,
  ) {
  }

  async findAll(): Promise<Event[]> {
    return await this.repository.find();
  }

  // go get all the events for a given tournament from the VR API.
  async importEventsFromVR(tournament: Tournament, importStats: JobStats): Promise<boolean> {
    const events_json = await this.vrapi.get('Tournament/' + tournament.tournamentCode + '/Event');
    const events: any[] = VRAPIService.arrayify(events_json.TournamentEvent);
    logger.info(events.length + ' events found');

    let e: Event;
    // go and create the events
    for (const event of events) {
      e = new Event();
      e.buildFromVRAPIObj(event);
      e.tournament = tournament;
      e.draws = [];
      e.matches = [];
      const entries_json = await this.vrapi.get(
        'Tournament/' + tournament.tournamentCode +
        '/Event/' + event.Code + '/Entry');
      const entries: any[] = VRAPIService.arrayify(entries_json.Entry);
      e.rosterSize = entries.length;

      // Note: We are electing not to put the roster in the database
      // mainly because they are not guaranteed, and in fact often do
      // not have, valid membership identifiers, which means the best
      // we can do is put in a list of members.
      await this.repository.save(e);

      // Now dig down and load the draws for this event.
      await this.drawService.importDrawsFromVR(e, importStats);

      importStats.bump(CREATION_COUNT);
    }
    return true;
  }

  // Get the ranks publication that applies to this event.
  // This would be the publication from the week before the tournament starts.
  async getRankingsPublication(event: Event) {
    // go get the rankings category for this event
    const eventCategory: VRRankingsCategory =
      await this.categoryService.getRankingCategoryFromId(event.categoryId);
    console.log('Ranking Category: ' + JSON.stringify(eventCategory));

    const d = moment(event.tournament.startDate).subtract(1, 'week');
    let year = d.year();
    let week = d.isoWeek();
    if (year < 2014) {
      year = 2013;
      week = 53;
    }
    return await this.rankingsPubService.findByCategoryYearWeek(eventCategory, year, week);
  }

  /* Find all the players who actually played in an event by looking
   * at any player that shows up at least once in matches played in that event.
   */
  async getRoster(eventId): Promise<any[]> {
    return await this.entityManager.query(
      'select DISTINCTROW p.* from event e\n' +
      'LEFT JOIN `match` m ON e.eventId = m.eventId\n' +
      'LEFT JOIN matchplayer mp ON m.matchId = mp.matchId\n' +
      'LEFT JOIN player p ON mp.playerId = p.playerId\n' +
      'WHERE e.eventId = "' + eventId + '"');
  }

  /* Same as fetching the event roster, but also add in the player ranking
   * at the date of the event.
   */
  async getRatedRoster(event: Event): Promise<any[]> | null {
    const rankingPublication = await this.getRankingsPublication(event);
    console.log('Ranking Publication: ' + JSON.stringify(rankingPublication));
    return await this.entityManager.query(
      'select DISTINCTROW p.*, ri.*  from event e\n' +
      'LEFT JOIN `match` m ON e.eventId = m.eventId\n' +
      'LEFT JOIN matchplayer mp ON m.matchId = mp.matchId\n' +
      'LEFT JOIN player p ON mp.playerId = p.playerId\n' +
      'LEFT JOIN vrRankingsItem ri ON p.playerId = ri.playerId\n' +
      'WHERE e.eventId = "' + event.eventId + '"' +
      ' AND ri.publicationId = ' + rankingPublication.publicationId);
  }

  async rateEvents(fromDate: Date,
                   toDate: Date,
                   province: string,
                   categories: string[],
                   gender: string = null): Promise<string>{
    const wb: WorkBook = utils.book_new();
    wb.Props = {
      Title: 'Tennis Canada Event Ratings',
    };
    for (const category of categories) {
      let newCategory: boolean = true;
      // let events: any[] = [];
      let events: Event[] = [];
      if (province) {
        events = await this.repository
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.tournament', 'tournament')
          .leftJoinAndSelect('tournament.license', 'license')
          .where(`event.categoryId = '${category}'`)
          .andWhere(`tournament.endDate <= '${toDate}'`)
          .andWhere(`tournament.endDate >= '${fromDate}'`)
          .andWhere(`license.province = '${province}'`)
          .getMany();
      }
      else {
        events = await this.repository
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.tournament', 'tournament')
          .leftJoinAndSelect('tournament.license', 'license')
          .where(`event.categoryId = '${category}'`)
          .andWhere(`tournament.endDate <= '${toDate}'`)
          .andWhere(`tournament.endDate >= '${fromDate}'`)
          .getMany();
      }

      for (const event of events) {
        console.log('Event:' + JSON.stringify(event));
        console.log('Tournament' + JSON.stringify(event.tournament));
        console.log('License' + JSON.stringify(event.tournament.license));
        const ratedRoster = await this.getRatedRoster(event);
        for (const player of ratedRoster) {
          console.log('Player: ' + JSON.stringify(player));
        }
        if (newCategory) {
          this.addCategoryToWorkbook(wb, category);
          newCategory = false;
        }
        // this.addEventToWorkbook(wb, eventData);
      }
    }
    const now: Date = new Date();
    const filename = 'Reports/Event_Rating_' + now.toISOString().substr(0, 10) + '.xlsx';
    // writeFile(wb, filename);
    return filename;
  }

  private addCategoryToWorkbook(wb: WorkBook, category: string) {
    return 'temporaryLintStopper';
  }

  private addEventToWorkbook(wb: WorkBook, event: any) {
    return 'temporaryLintStopper';

  }
}
