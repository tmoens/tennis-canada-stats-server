import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Draw } from './draw.entity';
import {VRAPIService} from '../../VRAPI/vrapi.service';
import {Event} from '../event/event.entity';
import {getLogger} from 'log4js';
import {MatchService} from '../match/match.service';
import {Injectable} from '@nestjs/common';
import {JobStats} from '../../../utils/jobstats';

const CREATION_COUNT = 'draw_creation';
const logger = getLogger('drawService');

@Injectable()
export class DrawService {
  constructor(
    @InjectRepository(Draw)
    private readonly repository: Repository<Draw>,
    private readonly matchService: MatchService,
    private readonly vrapi: VRAPIService,
    )
  {  }

  async findAll(): Promise<Draw[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database wrt draws.
  async importDrawsFromVR(event: Event, importStats: JobStats): Promise<boolean> {
    const draws_json = await this.vrapi.get(
      'Tournament/' + event.tournament.tournamentCode +
      '/Event/' + event.eventCode +
      '/Draw',
    );
    const draws: any[] = VRAPIService.arrayify(draws_json.TournamentDraw);
    logger.info(draws.length + ' draws found');

    let d: Draw;
    for (const draw of draws) {
      d = new Draw();
      d.buildFromVRAPIObj(draw);
      d.event = event;
      d.matches = [];
      await this.repository.save(d);
      // event.draws.push(d);

      // Now dig down and load the matches from this draw.
      await this.matchService.importMatchesFromVR(d, importStats);

      // await this.repository.save(d);
      importStats.bump(CREATION_COUNT);
    }

    return true;
  }

}