import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {EventRating} from './event-rating.entity';
import {ExternalEvent} from '../external-event/external-event.entity';
import {getLogger} from 'log4js';
import {ExternalTournament} from '../external-tournament/external-tournament.entity';

const logger = getLogger('External Event Service');

@Injectable()
export class EventRatingService {
  constructor(
    @InjectRepository(EventRating)
    private readonly repo: Repository<EventRating>,
  ) {}

  async findAll(): Promise<EventRating[]> {
    return await this.repo.find();
  }

  async rateEvent(et: ExternalTournament, ee: ExternalEvent): Promise<EventRating|null> {
    const year = Number(et.endDate.substr(0, 4));
    let c: string = et.category;
    let sc: string = et.subCategory;
    let evType: string = ee.eventType;
    // In 2019 we started working on a straight point exchanger rate for
    // ITF Junior, ATP, WTA and ITF Transition Tour points. The event ratings
    // with the point exchange rates.
    // So We do not have ratings records for all categories and subcategories
    // ot these events anymore (thank goodness).
    if (year >= 2019) {
      switch (et.sanctioningBody) {
        case 'ITF':
          if ('Open' === ee.eventType) {
            c = 'TT';
            sc = 'TT';
          } else {
            evType = 'Junior';
            c = 'ITF';
            sc = 'ITF';
          }
          break;
        case 'ATP':
          c = 'ATP';
          sc = 'ATP';
          break;
        case 'WTA':
          c = 'WTA';
          sc = 'WTA';
          break;
      }
    }

    const ratings: EventRating[] = await this.repo.find({
      year,
      sanctioningBody: et.sanctioningBody,
      category: c,
      subCategory: sc,
      eventGender: ee.gender,
      eventType: evType});
    if (1 === ratings.length) {
      return ratings[0];
    } else {
      // We didn't find a rating for the event so an admin user will have to fill it in.
      logger.warn('Failed to find a rating for event ' + ee.eventId);
    }
    return null;
  }
}
