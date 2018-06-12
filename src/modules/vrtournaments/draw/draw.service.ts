import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Draw } from './draw.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {Event} from "../event/event.entity";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {isArray} from "util";
import {MatchService} from "../match/match.service";
import {Injectable} from "@nestjs/common";

const CREATION_COUNT = "draw_creation";
const logger = getLogger("drawService");

@Injectable()
export class DrawService {
  constructor(
    @InjectRepository(Draw)
    private readonly repository: Repository<Draw>,
    private readonly statsService: StatsService,
    private readonly matchService: MatchService,
    private readonly vrapi: VRAPIService,
    )
  {  }

  async findAll(): Promise<Draw[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database wrt draws.
  async importDrawsFromVR(event: Event): Promise<boolean> {
    let draws = await this.vrapi.get(
      "Tournament/" + event.tournament.tournamentCode +
      "/Event/" + event.eventCode +
      "/Draw"
    );

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of TournamentDraw s if there is more than one.
    // We want an array regardless of whether the event has 0, 1 or more draws
    if (null == draws.TournamentDraw) {
      draws = [];
    } else if (isArray(draws.TournamentDraw)) {
      draws = draws.TournamentDraw;
    } else {
      draws = [draws.TournamentDraw]
    }
    logger.info(draws.length + " draws found");

    let d: Draw;
    for (let i = 0; i < draws.length; i++) {
      d = new Draw();
      d.buildFromVRAPIObj(draws[i]);
      d.event = event;
      d.matches = [];
      await this.repository.save(d);

      // TODO I wonder if I should push the draw into the event
      // at this point.  If not, the event object is broken.
      // That is, if you just try to save, the save will fail
      // because of foreign key constraint.
      event.draws.push(d);

      // Now dig down and load the draws for this event.
      await this.matchService.importMatchesFromVR(d);

      await this.repository.save(d);
      this.statsService.bump(CREATION_COUNT);
    }

    return true;
  }

}