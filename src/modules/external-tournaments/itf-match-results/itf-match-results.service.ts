import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ItfMatchResult} from './itf-match-result.entity';
import {ExternalEvent} from '../external-event/external-event.entity';
import {ExternalPlayer} from '../external-player/external-player.entity';

@Injectable()
export class ItfMatchResultsService {
  constructor(
    @InjectRepository(ItfMatchResult)
    private readonly repo: Repository<ItfMatchResult>,
  ) {
  }

  async findAll(): Promise<ItfMatchResult[]> {
    return await this.repo.find();
  }

  /**
   * create or update an itf match record
   * @param externalEvent - the ExternalEvent that this match occurred
   * @param externalPlayer - the ExternalPlayer of interest
   * @param matchData - The data that was received from the ITF API for this match.
   */
  async loadFromITFAPI(
    externalEvent: ExternalEvent,
    externalPlayer: ExternalPlayer,
    matchData: any): Promise<ItfMatchResult | null> {
    let r: ItfMatchResult = await this.repo.findOne(
      {MatchId: matchData.MatchId, player: externalPlayer},
      {
        relations: ['event', 'player'],
      });
    if (!r) {
      r = this.repo.create({MatchId: matchData.MatchId, player: externalPlayer});
    }
    r.event = externalEvent;
    // Because the table was set up to have all exactly the same fields
    // as the data received from the ITF API, we can use the shortcut
    // on the next line.
    this.repo.merge(r, matchData);
    return await this.repo.save(r);
  }
}
