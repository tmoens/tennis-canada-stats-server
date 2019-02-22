import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ExternalEventResult} from './external-event-result.entity';
import {ExternalEvent} from '../external-event/external-event.entity';
import {ExternalPlayer} from '../external-player/external-player.entity';
import {getLogger} from 'log4js';
import {ExternalEventResultDTO} from './external-event-result.dto';
import {PointExchangeService} from '../point-exchange/point-exchange.service';

const logger = getLogger('externalEventResult');

@Injectable()
export class ExternalEventResultService {
  constructor(
    @InjectRepository(ExternalEventResult)
    private readonly repo: Repository<ExternalEventResult>,
    private readonly exchangeService: PointExchangeService,
  ) {}

  async findAll(): Promise<ExternalEventResult[]> {
    return await this.repo.find();
  }

  async loadFromITFAPI(e: ExternalEvent, p: ExternalPlayer, eventData: any ): Promise<ExternalEventResult | null> {
    let r: ExternalEventResult = await this.repo.findOne(
      {event: e, player: p},
      {relations: ['event', 'player'],
      });
    if (!r) {
      r = await this.repo.create({event: e, player: p});
    }
    if (await this.updateFromITFAPI(r, eventData)) {
      return await this.repo.save(r);
    } else {
      return null;
    }
  }

  async updateFromITFAPI(r: ExternalEventResult, d: any): Promise<boolean> {
    const localLogger = getLogger('itfapi');
    r.externalRankingPoints = d.RankingPoints;
    const fp = d.FinalPosition;
    if (!isNaN(Number(fp))) {
      r.finishPosition = fp;
    } else if ('R' === fp.substr(0, 1) && fp.length > 2) {
      r.finishPosition = Number(fp.substr(1));
    } else {
      switch (fp) {
        case 'WR':
          r.finishPosition = 1;
          break;
        case 'RU':
          r.finishPosition = 2;
          break;
        case 'SF':
          r.finishPosition = 4;
          break;
        case 'QF':
          r.finishPosition = 8;
          break;
        default:
          localLogger.warn('Unrecognized finish position: ' + fp);
          return false;
      }
    }
    return true;
  }

  // The client has asked for a filtered set of external event results using an HTTP get query.
  // The query contains a number of possible fields which are converted to an sql query.
  async getFilteredResults(query: any): Promise<ExternalEventResultDTO[] | null> {
    let q = this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.player', 'p')
      .leftJoinAndSelect('p.tcPlayer', 'tcp')
      .leftJoinAndSelect('r.event', 'e')
      .leftJoinAndSelect('e.tournament', 't');

    if (query.sanctioningBody) {
      q = q.where('t.sanctioningBody = :sb', {sb: query.sanctioningBody});
    } else {
      q = q.where('1');
    }
    if (query.VRID ) {
      q = q.andWhere('tcp.playerId = :pid', {pid: query.VRID});
    }
    if (query.playerId ) {
      q = q.andWhere('p.playerId = :pid', {pid: query.playerId});
    }
    if (query.start) {
      q = q.andWhere('t.endDate >= :sp', {sp: query.start});
    }
    if (query.end) {
      q = q.andWhere('t.endDate <= :ep', {ep: query.end});
    }
    if (query.tournamentName) {
      q = q.andWhere('t.name LIKE :tn', {tn: '%' + query.tournamentName + '%'});
    }
    if (query.lastName) {
      q = q.andWhere('p.lastName LIKE :ln', {ln: '%' + query.lastName + '%'});
    }
    if (query.category) {
      if (query.category === 'Junior') {
        q = q.andWhere('t.tournamentId LIKE "J%"');
      } else {
        q = q.andWhere('t.category = :category', {category: query.category});
      }
    }
    if (query.gender) {
      if (query.gender === 'F') {
        q = q.andWhere('t.tournamentId LIKE "W%"');
      }
      if (query.category === 'M') {
        q = q.andWhere('t.tournamentId LIKE "M%"');
      }
    }

    const results = await q.orderBy({'p.lastName': 'ASC', 't.endDate': 'DESC'}).getMany();

    // Now we have an array of results and 5 related objects.  But the client only
    // wants to present a table.  So we have to flatten everything down for them.
    // Better than them doing it. I think.

    // NOTE: When a junior plays in an open event, her result counts towards BOTH the Canadian
    // Open rankings and the canadian Junior rankings. So we might get two event result objects
    // for a single event result.
    const returnData: ExternalEventResultDTO[] = [];
    let exchangeRate: number;
    let year: number;
    let pointCurrency: string;
    let gender: string;

    for (const r of results) {
      year = r.event.tournament.getTournamentYear();
      pointCurrency = r.event.tournament.getPointCurrency();
      gender = r.event.gender;
      // Handle junior events.
      if (r.event.eventType === 'U18') {
        exchangeRate = await this.exchangeService.findExchaneRate(year, pointCurrency, gender, 'U18');
        returnData.push(new ExternalEventResultDTO(r, exchangeRate));
      }

      // Handle open events
      if (r.event.eventType === 'Open') {
        exchangeRate = await this.exchangeService.findExchaneRate(year, pointCurrency, gender, 'Open');
        returnData.push(new ExternalEventResultDTO(r, exchangeRate));
        // If the player was a junior at the end date of the tournament, we also create a result
        // as if this were a U18 tournament too.
        const yob = (r.player.DOB) ? parseInt(r.player.DOB.substr(0, 4), 10) : 0;
        if (parseInt(r.event.tournament.endDate.substr(0, 4), 10) - yob < 19) {
          exchangeRate = await this.exchangeService.findExchaneRate(year, pointCurrency, gender, 'U18');
          returnData.push(new ExternalEventResultDTO(r, exchangeRate));
        }
      }
    }
    return returnData;
  }

  // Allows the user to enter corrected externalPonts manually when the ones received through
  // the API are incorrect.  Put in place because the ITF API was not sending points for the
  // New ITF Transition Tour events.
  async overrideExternalPoints(externalEventResultDTO: ExternalEventResultDTO): Promise<any> {
    const target: ExternalEventResult = await this.repo.createQueryBuilder('r')
      .leftJoinAndSelect('r.player', 'p')
      .leftJoinAndSelect('r.event', 'e')
      .where('e.eventId = :eventId', {eventId: externalEventResultDTO.eventId})
      .andWhere('p.playerId = :playerId', {playerId: externalEventResultDTO.externalId})
      .getOne();

    if (isNaN(Number(externalEventResultDTO.manualPointAllocation)) || externalEventResultDTO.manualPointAllocation === '') {
      target.manualPointAllocation = null;
    } else {
      target.manualPointAllocation = Number(externalEventResultDTO.manualPointAllocation);
    }
    await this.repo.save(target);
    return true;
  }
}