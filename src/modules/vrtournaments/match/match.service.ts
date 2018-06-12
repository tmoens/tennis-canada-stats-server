import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from './match.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {PlayerService} from "../../player/player.service";
import {Draw} from "../draw/draw.entity";
import {isArray} from "util";
import {MatchPlayer} from "../match_player/match_player.entity";
import {Player} from "../../player/player.entity";
import {MatchPlayerService} from "../match_player/match_player.service";

const CREATION_COUNT = "match_creation";
const logger = getLogger("matchService");

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private readonly repository: Repository<Match>,
    private readonly statsService: StatsService,
    private readonly matchPlayerService: MatchPlayerService,
    private readonly vrapi: VRAPIService,) {
  }
  // @InjectRepository(MatchPlayer)
  // private readonly mpRepository: Repository<MatchPlayer>,

  async findAll(): Promise<Match[]> {
    return await this.repository.find();
  }

  // go get all the matches for a given tournament from the VR API.
  async importMatchesFromVR(draw: Draw): Promise<boolean> {
    let matches = await this.vrapi.get(
      "Tournament/" + draw.event.tournament.tournamentCode +
      "/Draw/" + draw.drawCode +
      "/Match"
    );
    // console.log("Matches: \n" + JSON.stringify(matches));

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of Match s if there is more than one.
    // We want an array regardless of whether the draw has 0, 1 or more matches
    if (null == matches) {
      matches = [];
    } else if (isArray(matches.Match)) {
      matches = matches.Match;
    } else {
      matches = [matches.Match];
    }

    let match: Match;
    for (let i= 0; i < matches.length; i++) {
      let matchData = matches[i];
      match = new Match();
      match.draw = draw;
      match.event = draw.event;
      match.matchPlayers = [];
      match.buildFromVRAPIObj(matchData);
      await this.repository.save(match);
      await this.matchPlayerService.importMatchPlayersFromVR(match,matchData);
      draw.matches.push(match);
      draw.event.matches.push(match);
      this.statsService.bump(CREATION_COUNT);
    }
    return true;
  }

}