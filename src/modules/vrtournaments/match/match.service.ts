import { Injectable, Inject } from '@nestjs/common';
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

  // go get all the matches for a given tournament from the VR API.
  async importMatchesFromVR(draw: Draw, importStats: JobStats): Promise<boolean> {
    const matches_json = await this.vrapi.get(
      'Tournament/' + draw.event.tournament.tournamentCode +
      '/Draw/' + draw.drawCode +
      '/Match',
    );
    const matches: any[] = VRAPIService.arrayify(matches_json.Match);

    let match: Match;
    for (const matchData of matches) {
      match = new Match();
      match.draw = draw;
      match.event = draw.event;
      match.matchPlayers = [];
      match.buildFromVRAPIObj(matchData);
      await this.repo.save(match)
        .catch(reason => {
          logger.error('Failed to save match data. Reason: ' + reason +
            ', Match Data: ' + JSON.stringify(matchData));
          importStats.bump(CREATION_FAIL_COUNT);
        });
      await this.matchPlayerService.importMatchPlayersFromVR(match, matchData);
      importStats.bump(CREATION_COUNT);
    }
    return true;
  }
}