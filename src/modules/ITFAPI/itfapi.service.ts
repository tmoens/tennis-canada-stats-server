import {Injectable} from '@nestjs/common';
import * as request from 'superagent';
import {getLogger} from 'log4js';
import {ConfigurationService} from '../configuration/configuration.service';
import * as moment from 'moment';
import {Moment} from 'moment';
import {ExternalTournamentService} from '../external-tournaments/external-tournament/external-tournament.service';
import {ExternalPlayerService} from '../external-tournaments/external-player/external-player.service';
import {ExternalPlayer} from '../external-tournaments/external-player/external-player.entity';
import {JobState, JobStats} from '../../utils/jobstats';
import {ExternalTournament} from '../external-tournaments/external-tournament/external-tournament.entity';
import {ExternalEventService} from '../external-tournaments/external-event/external-event.service';
import {ExternalEvent} from '../external-tournaments/external-event/external-event.entity';
import {PointExchangeService} from '../external-tournaments/point-exchange/point-exchange.service';
import {ExternalEventResultService} from '../external-tournaments/external-event-result/external-event-result.service';
import {ExternalEventResult} from '../external-tournaments/external-event-result/external-event-result.entity';
import {ItfMatchResultsService} from '../external-tournaments/itf-match-results/itf-match-results.service';

const HttpsAgent = require('agentkeepalive').HttpsAgent;
const DEBUG_LIMIT = 500000;
const logger = getLogger('itfapi');
// This service makes a call to the ITFAPI to load results in a given time period.
// The returned structure is a somewhat complicated nested JSON object which
// gets broken down and stored in it's constituent parts.

// OK, so what the heck is this agent?
// Well, if you do not use it, the "normal" agent will open up a new
// socket connection for each call to the API.  The API gets a
// a little testy about that and at some point says, does not accept
// any more connections ETIMEDOUT or some such thing.  So we have
// to push all our request down a number of sockets which we keep
// alive.  This line plus the use of one below where the agent is
// used cost about 6 hours.  Hence this rememory note.
const keepaliveAgent = new HttpsAgent({maxSockets: 10});

@Injectable()
export class ItfapiService {
  stats: JobStats;

  constructor(
    private readonly config: ConfigurationService,
    private readonly eventRatingService: PointExchangeService,
    private readonly externalTournamentService: ExternalTournamentService,
    private readonly externalPlayerService: ExternalPlayerService,
    private readonly externalEventService: ExternalEventService,
    private readonly externalEventResultService: ExternalEventResultService,
    private readonly itfMatchResultService: ItfMatchResultsService,
  ) {
    this.stats = new JobStats('Load play data from ITF API');
  }
  async get(pattern: string = ''): Promise<any[]> {
    let r: any[] = [];
    logger.info('calling: ' + this.config.itfapiURL + pattern);
    try {
      const response: any = await request
        .get(this.config.itfapiURL + pattern)
        .agent(keepaliveAgent)
        .auth(this.config.itfapiUser, this.config.itfapiPassword);
      // The results are in an array in a field called text in the response.
      r = JSON.parse(response.text);
      // console.log(JSON.stringify(r));
    } catch (e) {
      logger.error('Error calling IT API: ' + this.config.itfapiURL + pattern + ' Error: ' + e);
    }
    return r;
  }

  /* go get the data from the ITF API.
   * It comes back as a json array of players each with all results from that player nested like this:
   * Player
   *   Disciplines for each player (practically speaking only ever one discipline for a given query)
   *     Tournaments for each discipline
   *       Events for each Tournament (Draws, really)
   *         Matches in each Event
   */
  async loadResults() {
    this.stats = new JobStats('Load play data from ITF API');
    this.stats.setStatus(JobState.IN_PROGRESS);
    const endLoadingAt: Moment = moment();
    const startLoadingFrom: Moment = moment().subtract(this.config.itfLoaderPeriod, 'days');

    // ITF disciplines include Professional, Junior , Senior, Wheelchair and Beach
    // We are only interested in Pro and Junior results for now.
    const disciplines = ['pro', 'jun'];

    for (const discipline of disciplines) {
      const urlPattern = 'GetPlayerResults/' + discipline + '/CAN/' +
        startLoadingFrom.format('YYYY-MM-DD') + '/' +
        endLoadingAt.format('YYYY-MM-DD') +
        '?format=json';
      const results: any[] = await this.get(urlPattern);

      // The data comes back in an array field called "text" in the result.
      // There is one entry per player who has at least one result in the given
      // discipline in the given time period.
      let i = 0;
      for (const playerData of results){
        if (i++ >= DEBUG_LIMIT) break;
        const ep: ExternalPlayer = await this.externalPlayerService.loadFromITFAPI(playerData.Biography);
        this.stats.bump('players processed');

        // The player record has an array of disciplines.
        // Practically speaking it will only ever be one because our query to the
        // ITF API asked for the results for a single discipline.
        for (const disciplineData of playerData.Disciplines) {

          // The data for a Discipline has Statistics and Rankings data which we are
          // ignoring.  It then has a set of results, which is what we are after.
          for (const resultData of disciplineData.Results) {

            // A single set of result data has a bunch of attributes related to the
            // tournament in question.  So, we are going to pass that data to
            // the external tournament service to build or update the tournament.
            const et: ExternalTournament = await this.externalTournamentService.loadFromITFAPI(resultData);
            if (et) {
              this.stats.bump('tournaments loaded');
            } else {
              this.stats.bump('tournaments not loaded');
              logger.warn('Unable to load tournament: ' +
                resultData.TournamentId + '/' + resultData.PromoName);
              continue;
            }
            // The result data also has an array of events within the tournament.
            // We loop through them and add/update them in the database.
            for (const eventData of resultData.Events) {

              // A single chunk of event data has a bunch of attributes related to the event itself
              // So we go update those events.
              const ee: ExternalEvent = await this.externalEventService.loadFromITFAPI(et, eventData);
              if (ee) {
                this.stats.bump('events loaded');
              } else {
                this.stats.bump('events not loaded');
                logger.warn('Unable to load event: ' +
                  eventData.EventId + '/' + eventData.Name);
                continue;
              }

              // The event data also tells how the player in question did in the event in question
              // We store this as an event result.
              const eer: ExternalEventResult = await
                this.externalEventResultService.loadFromITFAPI(ee, ep, eventData);
              if (eer) {
                this.stats.bump('event results loaded');
              } else {
                this.stats.bump('event results not loaded');
                logger.warn('Unable to load event result for player: ' +
                  ep.playerId + '. Event: ' +
                  eventData.EventId + '/' + eventData.Name);
                continue;
              }

              // The event data also carries with it a list of all the matches
              // that the player played in order to achieve their result.
              // We load those now.
              let count: number;
              for (const matchData of eventData.Matches) {
                this.itfMatchResultService.loadFromITFAPI(ee, ep, matchData);
                count = this.stats.bump('itf matches loaded');
                if (count % 100 === 0) {
                  logger.info('Matches Loaded: ' + count);
                }
              }
            }
          }
        }
      }
    }
    this.stats.setStatus(JobState.DONE);
    logger.info(JSON.stringify(this.stats));
  }
}
