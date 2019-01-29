import {Injectable} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository} from 'typeorm';
import { Event } from './event.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {Tournament} from '../tournament/tournament.entity';
import {getLogger} from 'log4js';
import {PlayerService} from '../../player/player.service';
import {DrawService} from '../draw/draw.service';
import {JobStats} from '../../../utils/jobstats';
import {utils, WorkBook, WorkSheet, writeFile} from 'xlsx';
import {VRRankingsCategoryService} from '../../vrrankings/category/category.service';
import {VRRankingsPublicationService} from '../../vrrankings/publication/publication.service';
import * as moment from 'moment';
import {VRRankingsPublication} from '../../vrrankings/publication/publication.entity';
import {EventPlayerService} from '../event_player/event_player.service';
import {VRRankingsCategory} from '../../vrrankings/category/category.entity';
import {VRRankingsItemService} from '../../vrrankings/item/item.service';
import {Player} from '../../player/player.entity';

const CREATION_COUNT = 'event_creation';
const logger = getLogger('eventService');

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event) private readonly repository: Repository<Event>,
    private readonly drawService: DrawService,
    private readonly playerService: PlayerService,
    private readonly rosterService: EventPlayerService,
    private readonly vrapi: VRAPIService,
    private readonly categoryService: VRRankingsCategoryService,
    private readonly rankingsPubService: VRRankingsPublicationService,
    private readonly rankingsItemService: VRRankingsItemService,
  ) {
  }

  async findAll(): Promise<Event[]> {
    return await this.repository.find();
  }

  // Go fetch all the events for a given tournament from the VR API.
  async importEventsFromVR(tournament: Tournament, importStats: JobStats): Promise<boolean> {
    const events_json = await this.vrapi.get('Tournament/' + tournament.tournamentCode + '/Event');
    const eventsData: any[] = VRAPIService.arrayify(events_json.TournamentEvent);
    logger.info(eventsData.length + ' events found');

    // Build Event Objects from the event data returned by the VR API
    for (const eventData of eventsData) {
      const e = new Event();
      e.buildFromVRAPIObj(eventData);
      e.tournament = tournament;
      e.vrRankingsCategory = await this.categoryService.getRankingCategoryFromId(e.buildCategoryId());
      if (null === e.vrRankingsCategory) {
        logger.warn('Could not find ranking category for tournament: ' +
        tournament.tournamentCode + ', ' + tournament.name + ' event: '  + e.name);
      }
      e.draws = [];
      e.matches = [];
      e.players = [];

      // Find out how many entries there are in the event. For
      // doubles this will be half the number of players.
      const entries_json = await this.vrapi.get(
        'Tournament/' + tournament.tournamentCode +
        '/Event/' + eventData.Code + '/Entry');
      const entries: any[] = VRAPIService.arrayify(entries_json.Entry);
      e.numberOfEntries = entries.length;

      // Save the event.
      await this.repository.save(e).catch(reason => {
        logger.error(`Failed to save event (reason: ${reason}) prior to doing roster` +
          JSON.stringify(e));
        return false;
      });

      // Load the roster - I.e. the players in the event.
      await this.rosterService.loadRoster(e, entries, importStats );

      // TODO - I suspect I need to re-fetch the event at this point.

      // Now dig down and load the draws for this event.
      await this.drawService.importDrawsFromVR(e, importStats);

      importStats.bump(CREATION_COUNT);
    }
    return true;
  }

  // Find the ranking publication that applies to this event.
  // This would be the publication from the week before the tournament starts.
  async getRankingsPublication(event: Event): Promise<VRRankingsPublication> | null {
    const d = moment(event.tournament.startDate).subtract(1, 'week');
    let year = d.year();
    let week = d.isoWeek();
    if (year < 2014) {
      year = 2013;
      week = 53;
    }
    return await this.rankingsPubService.findByCategoryYearWeek(event.vrRankingsCategory, year, week);
  }

  /*
   * Create a report which rates events based on the strength of the players
   * in the events.
   * The result is provided in an excel book with one page per event category.
   */
  async rateEvents(fromDate: Date,
                   toDate: Date,
                   province: string,
                   categoryIds: string[]): Promise<string>{
    const wb: WorkBook = utils.book_new();
    logger.info('Generating event strength report.');
    wb.Props = {
      Title: 'Tennis Canada Event Ratings',
    };
    for (const categoryId of categoryIds) {
      // For every category we build a list of events in that category and '
      // a list of the players in those events complete with their ranking at
      // at the time of the event.
      const playerList: any[] = [];
      const eventList: any[] = [];
      // look up the rankings category object based on the given Id string
      const category: VRRankingsCategory =
        await this.categoryService.getRankingCategoryFromId(categoryId);
      if (!category) break;
      let events: Event[] = [];
      if (province) {
        events = await this.repository
          .createQueryBuilder('event')
          .leftJoinAndSelect('event.tournament', 'tournament')
          .leftJoinAndSelect('tournament.license', 'license')
          .leftJoinAndSelect('event.vrRankingsCategory', 'category')
          .leftJoinAndSelect('event.players', 'players')
          .leftJoinAndSelect('players.player', 'player')
          .where(`event.vrCategoryCode = '${category.categoryCode}'`)
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
          .leftJoinAndSelect('event.vrRankingsCategory', 'category')
          .leftJoinAndSelect('event.players', 'players')
          .leftJoinAndSelect('players.player', 'player')
          .where(`event.vrCategoryCode = '${category.categoryCode}'`)
          .andWhere(`tournament.endDate <= '${toDate}'`)
          .andWhere(`tournament.endDate >= '${fromDate}'`)
          .getMany();
      }

      for (const event of events) {
        // console.log("Event: " + JSON.stringify(event));
        const pub = await this.getRankingsPublication(event);
        // if you cannot find a rankings publication for the event,
        // you cannot rate the event.
        if (!pub) {
          logger.warn(
            'Can not rate event because can not find a ranking publication for it: ' +
            JSON.stringify(event));
        } else {
          // console.log('Rankings Publication: ' + JSON.stringify(pub));
          let numRatedPlayers: number = 0;
          let numUnratedPlayers: number = 0;
          let eventRating: number = 0;
          for (const eventPlayer of event.players) {
            const player: Player = eventPlayer.player;
            const rankItem =
              await this.rankingsItemService.findByPubAndPlayer(player, pub);
            if (rankItem) {
              numRatedPlayers++;
              const rating = 1 / Math.pow(rankItem.rank, 0.7);
              playerList.push({
                event: event.eventId,
                playerId: player.playerId,
                firstName: player.firstName,
                lastName: player.lastName,
                rank: rankItem.rank,
                points: rankItem.points,
                rating,
              });
              eventRating = eventRating + rating;
            } else {
              numUnratedPlayers++;
            }
          }
          const e = {
            tournamentCode: event.tournament.tournamentCode,
            eventCode: event.eventCode,
            tournamentName: event.tournament.name,
            startDate: event.tournament.startDate,
            endDate: event.tournament.endDate,
            province: event.tournament.license.province,
            category: event.vrRankingsCategory.categoryName,
            name: event.name,
            numEntries: event.numberOfEntries,
            numMembers: event.players.length,
            numRatedPlayers,
            numUnratedPlayers,
            grade: event.grade,
            winnerPoints: event.winnerPoints,
            STRENGTH: eventRating,
          };
          eventList.push(e);
        }
      }
      const playerSheet: WorkSheet = await utils.json_to_sheet(playerList);
      utils.book_append_sheet(wb, playerSheet, categoryId + 'Players');
      const eventSheet: WorkSheet = await utils.json_to_sheet(eventList);
      utils.book_append_sheet(wb, eventSheet, categoryId + 'Events');
    }
    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `Reports/Event_Rating_${now}.xlsx`;
    await writeFile(wb, filename);
    return filename;
  }
}
