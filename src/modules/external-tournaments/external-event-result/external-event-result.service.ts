import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ExternalEventResult} from './external-event-result.entity';
import {ExternalEvent} from '../external-event/external-event.entity';
import {ExternalPlayer} from '../external-player/external-player.entity';
import {getLogger} from 'log4js';

const logger = getLogger('externalEventResult');

@Injectable()
export class ExternalEventResultService {
  constructor(
    @InjectRepository(ExternalEventResult)
    private readonly repo: Repository<ExternalEventResult>,
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
      .leftJoinAndSelect('e.tournament', 't')
      .leftJoinAndSelect('e.eventRating', 'ra');

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
    const results = await q.orderBy({'p.lastName': 'ASC', 't.endDate': 'DESC'})
      .getMany();

    // Now we have an array of results and 5 related objects.  But the client only
    // wants to present a table.  So we have to flatten everything down for them.
    // Better than them doing it. I think.

    // NOTE: When a junior plays in an open event, her result counts towards BOTH the Canadian
    // Open rankings and the canadian Junior rankings. So we might get two event result objects
    // for a single event result.
    const returnData: ExternalEventResultDTO[] = [];
    for (const r of results) {
      // Handle junior events.
      if (r.event.eventType === 'U18') {
        returnData.push(new ExternalEventResultDTO(r));
      }

      // Handle open events
      if (r.event.eventType === 'Open') {
        returnData.push(new ExternalEventResultDTO(r));
        // If the player was a junior at the end date of the tournament, we also create a result
        // as if this were a U18 tournament too.
        const yob = (r.player.DOB) ? parseInt(r.player.DOB.substr(0, 4), 10) : 0;
        if (parseInt(r.event.tournament.endDate.substr(0, 4), 10) - yob < 19) {
          r.event.eventType = 'U18';
          returnData.push(new ExternalEventResultDTO(r));
        }
      }
    }
    return returnData;
  }

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

export class ExternalEventResultDTO {
  eventId: string;
  finishPosition: number;
  externalRankingPoints: string;
  manualPointAllocation: string | null;
  tcPoints: string;
  tournamentName: string;
  sanctioningBody: string;
  endDate: string;
  tournamentType: string;
  eventType: string;
  eventGender: string;
  eventDiscipline: string;
  pointsCategory: string;
  shortPointsCategory: string;
  playerName: string;
  drawSize: number;
  yob: number;
  externalId: string;
  internalId: number;

  constructor(r: ExternalEventResult) {
    this.eventId = r.event.eventId;
    this.finishPosition = r.finishPosition;
    this.externalRankingPoints = r.externalRankingPoints.toString();
    this.manualPointAllocation = (r.manualPointAllocation) ? r.manualPointAllocation.toString() : null;
    // For some reason, the runtime is thinking that the player DOB is a string.
    // But the compiler and Webstorm (correctly) think it is a date and will not let me
    // treat it as a string. It is a "date" type in the database and a "Date" type in
    // the TypeORM entity file.
    // Soooo, I changed it to a string in the entity definition. barf.
    // this.yob = (r.player.DOB) ? r.player.DOB.getFullYear() : null; // <== should be
    this.yob = (r.player.DOB) ? parseInt(r.player.DOB.substr(0, 4), 10) : 0;
    this.tournamentName = r.event.tournament.name;
    this.sanctioningBody = r.event.tournament.sanctioningBody;
    this.tournamentType = r.event.tournament.sanctioningBody + '/' + r.event.tournament.category;
    this.eventType = r.event.eventType;
    this.eventGender  = r.event.gender;
    this.eventDiscipline = r.event.discipline;
    this.endDate = r.event.tournament.endDate;
    this.playerName = r.player.firstName + ' ' + r.player.lastName;
    this.externalId = r.player.playerId;
    this.internalId = (r.player.tcPlayer) ? r.player.tcPlayer.playerId : null;
    this.drawSize = r.event.drawSize;

    if (r.event.ignoreResults) {
      this.tournamentName = this.tournamentName + ' (q)';
    }
    if (this.eventType === 'Open') {
      this.computeOpenPoints(r);
      this.pointsCategory =
        ((this.eventGender === 'F') ? 'W' : 'M') +
        this.eventDiscipline.substr(0, 1) + ' - ' +
        this.eventType;
      this.shortPointsCategory = [
        ('M' === this.eventGender) ? 'M' : 'W',
        this.eventDiscipline.substr(0, 1),
      ].join('');
    } else {
      this.computeJuniorPoints(r);
      this.pointsCategory = [
        ('M' === this.eventGender) ? 'Boys' : 'Girls',
        this.eventType,
        this.eventDiscipline,
      ].join(' ');
      this.shortPointsCategory = [
        ('M' === this.eventGender) ? 'B' : 'G',
        this.eventType,
        this.eventDiscipline.substr(0, 1),
      ].join('');
    }
  }

  getExternalPoints(): number | null {
    return (this.manualPointAllocation) ? Number(this.manualPointAllocation) : Number(this.externalRankingPoints);
  }

  // Compute how many canadian junior ranking points are due to the player for this external result
  // Note to self: Why are these points not in the database???
  // Answer: Because if you ever what to change the way they are computed,
  // You have to go and change every record in the database.
  // Also, if you change the rating of any tournament,
  // you have to go and change the ratings for the results of that tournament.
  // Also if, if you change a rating record (god forbid), you would have to go
  // change the ratings of all the results of all the tournaments that use that record.
  // Soooo, let's just compute the points whenever we need them.
  computeJuniorPoints(r: ExternalEventResult) {

    // Qualifiers and some other tournaments are not awarded junior points.
    if (r.event.ignoreResults) {
      this.tcPoints = '-';
      return;
    }

    // If the event does not have a rating, we cannot compute points for it.
    if (!r.event.eventRating) {
      this.tcPoints = 'unrated';
      return;
    }

    // If points are awarded by simply converting from the currency of the tournament
    // To Canadian Junior points, then do that arithmetic now.
    if (r.event.eventRating.pointExchangeRate) {
      // But it is not possible to do if the external points are not known
      if (this.getExternalPoints() === null) {
        this.tcPoints = 'external points?';
        return;
      } else {
        this.tcPoints = (this.getExternalPoints() * r.event.eventRating.pointExchangeRate).toString();
        return;
      }
    }

    // Calculate points by using the finish position, the Sanctioning Body
    // rating and the event rating

    // There is special treatment for Junior Grand Slams and the Orange Bowl.
    const isGrandSlamOrOrangeBowl: boolean = (
      r.event.tournament.name === 'Orange Bowl' || (
        r.event.eventRating.category === 'Grade A' && r.event.eventRating.subCategory === 'Grand Slam'
      )
    );

    // There is special treatment for first round losses
    // Note to self: why ">="? Because sometime you get a finish position of 64
    // (as in a loss in the round of 64) for a draw with draw size of 48.
    const isFirstRoundLoss = r.finishPosition >= r.event.drawSize;

    // No points for first round losers outside of Orange bowl and Jr Grand Slams
    if (isFirstRoundLoss && ! isGrandSlamOrOrangeBowl) {
      this.tcPoints = '0';
      return;
    } else {
      // Calculate the points
      const points: number = (Math.round(r.event.eventRating.eventRating * r.event.eventRating.sanctioningBodyRating * 10000 *
        Math.pow(.6, Math.log2(r.finishPosition))));
      if (isGrandSlamOrOrangeBowl && r.finishPosition >= r.event.drawSize) {
        // First round losers in OrangeBowl and Junior Grand Slams get half points
        // So spoketh the Deborah and so it shall be.
        this.tcPoints = (points / 2).toString();
        return;
      } else {
        this.tcPoints = points.toString();
        return;
      }
    }
  }

  // Compute how many open ranking points are due to the player for this external result
  computeOpenPoints(r: ExternalEventResult): string {
    // Open points are only available for Open events.
    if (r.event.eventType !== 'Open') {
      this.tcPoints = '-';
      return;
    }

    if (this.getExternalPoints() === null) {
      // But it is not possible to do if the external points are not known
      this.tcPoints = 'external points?';
      return;
    }

    // I canna believe I am hard-coding this.
    if ('TT' === r.event.tournament.category) {
      if ('F' === r.event.gender) {
        this.tcPoints = (40 * this.getExternalPoints()).toString();
        return;
      } else {
        this.tcPoints = (80 * this.getExternalPoints()).toString();
        return;
      }
    } else if ('ATP' === r.event.tournament.sanctioningBody ||
      'WTA' === r.event.tournament.sanctioningBody) {
      this.tcPoints = (1000 * this.getExternalPoints()).toString();
      return;
    }
    logger.error('Could not compute external points for: ' + JSON.stringify(r));
    this.tcPoints = '?';
    return;
  }
}
