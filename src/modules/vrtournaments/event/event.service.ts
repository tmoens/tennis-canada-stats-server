import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './event.entity';
import { VRAPIService } from '../../VRAPI/vrapi.service';
import { Tournament } from '../tournament/tournament.entity';
import { getLogger } from 'log4js';
import { DrawService } from '../draw/draw.service';
import { JobState, JobStats } from '../../../utils/jobstats';
import { utils, WorkBook, WorkSheet, writeFile } from 'xlsx';
import { VRRankingsCategoryService } from '../../vrrankings/category/category.service';
import { VRRankingsPublicationService } from '../../vrrankings/publication/publication.service';
import * as moment from 'moment';
import { VRRankingsPublication } from '../../vrrankings/publication/publication.entity';
import { EventPlayerService } from '../event_player/event_player.service';
import { VRRankingsCategory } from '../../vrrankings/category/category.entity';
import { VRRankingsItemService } from '../../vrrankings/item/item.service';
import { Player } from '../../player/player.entity';

const CREATION_COUNT = 'event_creation';
const logger = getLogger('eventService');

@Injectable()
export class EventService {
  ratingStats: JobStats;
  constructor(
    @InjectRepository(Event) private readonly repository: Repository<Event>,
    private readonly drawService: DrawService,
    private readonly rosterService: EventPlayerService,
    private readonly vrapi: VRAPIService,
    private readonly categoryService: VRRankingsCategoryService,
    private readonly rankingsPubService: VRRankingsPublicationService,
    private readonly rankingsItemService: VRRankingsItemService,
  ) {
    this.ratingStats = new JobStats('gradingStats');
  }

  getRatingStats(): JobStats {
    return this.ratingStats;
  }

  async findAll(): Promise<Event[]> {
    return await this.repository.find();
  }

  // Go fetch all the events for a given tournament from the VR API.
  async importEventsFromVR(
    tournament: Tournament,
    importStats: JobStats,
  ): Promise<boolean> {
    const events_json = await this.vrapi.get(
      'Tournament/' + tournament.tournamentCode + '/Event',
    );
    const eventsData: any[] = VRAPIService.arrayify(
      events_json.TournamentEvent,
    );
    logger.info(eventsData.length + ' events found');

    // Build Event Objects from the event data returned by the VR API
    for (const eventData of eventsData) {
      const e = new Event();
      e.buildFromVRAPIObj(eventData);
      e.tournament = tournament;
      // For regular tournaments, figure out the rankings category for the event.
      // For leagues, the rankings category for an event in a league is meaningless -
      // even if it is in the data from VR.
      // Why? Because matches between teams within an event in a league usually include several
      // matches each of which can be in different rankings categories. For example, league matches
      // in the Inter-county Junior league could involve a U16 Boys Single, a U16 Girls Singles
      // and a U14 boys doubles.
      if (tournament.isLeague()) {
        e.vrRankingsCategory = null;
      } else {
        e.vrRankingsCategory =
          await this.categoryService.getRankingCategoryFromId(
            e.buildCategoryId(),
          );
        if (null === e.vrRankingsCategory) {
          // In box leagues, it is possible that an event has a normal rankings category like
          // Boys Under 24 Doubles, but it is possible that the event is for some
          // category the TD made up like "Mixed Lefty Wood Racket Singles"
          logger.warn(
            'Could not find ranking category for tournament: ' +
              tournament.tournamentCode +
              ', ' +
              tournament.name +
              ' event: ' +
              e.name,
          );
        }
      }
      e.draws = [];
      e.matches = [];
      e.players = [];

      // Find out how many entries there are in the event. For
      // doubles this will be half the number of players.
      const entries_json = await this.vrapi.get(
        'Tournament/' +
          tournament.tournamentCode +
          '/Event/' +
          eventData.Code +
          '/Entry',
      );
      const entries: any[] = VRAPIService.arrayify(entries_json.Entry);
      e.numberOfEntries = entries.length;

      // Save the event.
      await this.repository.save(e).catch((reason) => {
        logger.error(
          `Failed to save event (reason: ${reason}) prior to doing roster` +
            JSON.stringify(e),
        );
        return false;
      });

      // Load the roster - I.e. the players in the event.
      await this.rosterService.loadRoster(e, entries, importStats);

      // Now dig down and load the draws for this event.
      await this.drawService.importDrawsFromVR(e, importStats);

      importStats.bump(CREATION_COUNT);
    }
    return true;
  }

  // Find the ranking publication that applies to this event.
  // This would be the publication from the week before the tournament starts.
  async getRankingsPublication(
    event: Event,
  ): Promise<VRRankingsPublication> | null {
    const d = moment(event.tournament.startDate).subtract(1, 'week');
    let year = d.year();
    let week = d.isoWeek();
    if (year < 2014) {
      year = 2013;
      week = 53;
    }
    const pub: VRRankingsPublication | null =
      await this.rankingsPubService.findByCategoryYearWeek(
        event.vrRankingsCategory,
        year,
        week,
      );
    if (!pub) {
      logger.error(
        `Failed looking for rankings for event: ${event.eventId} year: ${year} week: ${week}`,
      );
    }
    return pub;
  }

  /*
   * Create a report which rates events based on the strength of the players
   * in the events.
   * The result is provided in an Excel book with one page per event category.
   * We rate Tournaments events only, not league events.
   */
  async rateEvents(
    fromDate: Date,
    toDate: Date,
    province: string,
    categoryIds: string[],
  ): Promise<string> {
    const wb: WorkBook = utils.book_new();
    this.ratingStats = new JobStats(`Rating events`);
    this.ratingStats.setStatus(JobState.IN_PROGRESS);
    logger.info('Generating event strength report.');
    wb.Props = {
      Title: 'Tennis Canada Event Ratings',
    };
    this.ratingStats.toDo = categoryIds.length;
    this.ratingStats.setCounter('done', 0);
    for (const categoryId of categoryIds) {
      // For every category we build a list of events in that category and
      // a list of the players in those events complete with their ranking
      // at the time of the event.
      const playerList: any[] = [];
      const eventList: any[] = [];
      // look up the rankings category object based on the given categoryId
      const category: VRRankingsCategory =
        await this.categoryService.getRankingCategoryFromId(categoryId);
      if (!category) break;
      let events: Event[] = [];
      let q = this.repository
        .createQueryBuilder('event')
        .leftJoinAndSelect('event.tournament', 'tournament')
        .leftJoinAndSelect('tournament.license', 'license')
        .leftJoinAndSelect('event.vrRankingsCategory', 'category')
        .leftJoinAndSelect('event.players', 'players')
        .leftJoinAndSelect('players.player', 'player')
        .where(`event.vrCategoryCode = '${category.categoryCode}'`)
        .andWhere(`event.numberOfEntries > 0`)
        .andWhere(`tournament.typeId = 0`)
        .andWhere(`tournament.endDate <= '${toDate}'`)
        .andWhere(`tournament.endDate >= '${fromDate}'`);
      if (province) {
        q = q.andWhere(`license.province = '${province}'`);
      }
      // console.log(q.getSql());
      events = await q.getMany();

      for (const event of events) {
        this.ratingStats.setData(
          'currentEvent',
          `Category: ${category.categoryName}, Tournament: ${event.tournament.name}, Event: ${event.name}.`,
        );
        this.ratingStats.bump('eventsProcessed');
        // console.log(`event: ${event.eventId}, entries: ${event.numberOfEntries}, province: ${event.tournament.license.province}`)
        const pub = await this.getRankingsPublication(event);
        // console.log(`publication: ${JSON.stringify(pub)}`);
        // if you cannot find a rankings publication for the event,
        // you cannot rate the event.
        if (!pub) {
          logger.warn(
            'Can not rate event because can not find a ranking publication for it: ' +
              JSON.stringify(event, null, 2),
          );
          this.ratingStats.addNote(
            `Error: Cannot rate tournament ${event.tournament.tournamentCode} (${event.tournament.name}), event: ${event.name} could not find rankings for tournament date.`,
          );
          this.ratingStats.bump('Events without appropriate rankings');
        } else {
          // console.log('Rankings Publication: ' + JSON.stringify(pub));
          let numRatedPlayers: number = 0;
          let numUnratedPlayers: number = 0;
          let eventRating: number = 0;
          for (const eventPlayer of event.players) {
            const player: Player = eventPlayer.player;
            const rankItem = await this.rankingsItemService.findByPubAndPlayer(
              player,
              pub,
            );
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
                birthYear: player.DOB?.slice(0, 4),
                rating,
              });
              eventRating = eventRating + rating;
            } else {
              numUnratedPlayers++;
            }
          }
          if (event.numberOfEntries === numUnratedPlayers) {
            logger.warn(
              `No rated players found for event ${event.eventId} using rankings (sub)publication: ${pub.publicationId}`,
            );
            this.ratingStats.bump('Events with no rated players');
          }
          const e = {
            tournamentCode: event.tournament.tournamentCode,
            eventCode: event.eventCode,
            eventId: event.eventId,
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
      const playerSheet: WorkSheet = utils.json_to_sheet(playerList);
      utils.book_append_sheet(wb, playerSheet, categoryId + 'Players');
      const eventSheet: WorkSheet = utils.json_to_sheet(eventList);
      utils.book_append_sheet(wb, eventSheet, categoryId + 'Events');
      this.ratingStats.bump('done');
    }
    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `Reports/Event_Rating_${now}.xlsx`;
    await writeFile(wb, filename);
    this.ratingStats.setData('filename', filename);
    this.ratingStats.setStatus(JobState.DONE);
    return filename;
  }
}
