import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {Draw} from '../draw/draw.entity';
import {MatchPlayerService} from '../match_player/match_player.service';
import {JobStats} from '../../../utils/jobstats';
import {getLogger} from 'log4js';

const CREATION_COUNT = 'match_creation';
const CREATION_FAIL_COUNT = 'match_creation_fail';
const logger = getLogger('matchService');

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly repo: Repository<Match>,
    private readonly matchPlayerService: MatchPlayerService,
    private readonly vrapi: VRAPIService) {
  }

  async findAll(): Promise<Match[]> {
    return await this.repo.find();
  }

  // go get all the matches for a given tournament or league from the VR API.
  async importMatchesFromVR(draw: Draw, importStats: JobStats): Promise<boolean> {
    const tl_matches_json = await this.vrapi.get(
      'Tournament/' + draw.event.tournament.tournamentCode +
      '/Draw/' + draw.drawCode +
      '/Match',
    );


    // When importing matches from a tournament, the above API call gives  a
    // list of "Match"es.
    if (draw.event.tournament.isTournament()) {
      const matches: any[] = VRAPIService.arrayify(tl_matches_json.Match);
      logger.info(matches.length + ' matches found');
      await this.processMatches(draw, matches, importStats);
    }

    // However, when importing matches from a league, the same API call
    // gives a list of "TeamMatch"es. So, you have to make another
    // API call to get the "Match"es within each "TeamMatch";
    if (draw.event.tournament.isLeague()) {
      const teamMatches: any[] = VRAPIService.arrayify(tl_matches_json.TeamMatch);

      logger.info(teamMatches.length + ' team matches (fixtures) found');
      for (const tm of teamMatches) {
        const matches_json = await this.vrapi.get(
          'Tournament/' + draw.event.tournament.tournamentCode +
          '/TeamMatch/' + tm.Code,
        );
        const matches: any[] = VRAPIService.arrayify(matches_json.Match);
        logger.info(matches.length + ' matches found');
        await this.processMatches(draw, matches, importStats);
      }
    }

    // It is probably worth noting that the Match object VR gives for Tournaments
    // is considerably richer than the Match object VR gives for Leagues.
    // The extra information in a tournament's Match includes things like
    // the event code, the draw code, the draw name, and the rankings category name
    // of the event and draw in which the match occurred.
    // But we do not need any of that because it is all available locally in
    // in the draw object and the draw.event object.
    return true;
  }

  async processMatches(draw: Draw, matches: any[], importStats: JobStats) {
    for (const match_json of matches) {
      const match = new Match();
      match.draw = draw;
      match.event = draw.event;
      match.vrDrawCode = draw.drawCode;
      match.vrEventCode = draw.event.eventCode;
      match.matchPlayers = [];
      match.buildFromVRAPIObj(match_json);
      // do not try to save matches that do not have a score
      // they are matches that have not been played or matches where
      // the players are not yet determined.  These matches will be added
      // as the tournament is updated and the scores are known.
      if (match.score) {
        await this.repo.save(match)
          .catch(reason => {
            logger.error('Failed to save match data. Reason: ' + reason +
              ', Match Data: ' + JSON.stringify(match_json));
            importStats.bump(CREATION_FAIL_COUNT);
          });
        await this.matchPlayerService.importMatchPlayersFromVR(match, match_json);
        importStats.bump(CREATION_COUNT);
      }
    }
  }
}
