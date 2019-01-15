import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {ExternalEvent} from './external-event.entity';
import {ExternalTournament} from '../external-tournament/external-tournament.entity';
import {getLogger} from 'log4js';
import {EventRatingService} from '../event-rating/event-rating.service';

@Injectable()
export class ExternalEventService {
  constructor(
    @InjectRepository(ExternalEvent)
    private readonly repo: Repository<ExternalEvent>,
    private readonly eventRatingService: EventRatingService,
  ) {}

  async findAll(): Promise<ExternalEvent[]> {
    return await this.repo.find();
  }

  async loadFromITFAPI(et: ExternalTournament, eventData: any ): Promise<ExternalEvent | null> {
    let e: ExternalEvent = await this.repo.findOne(eventData.EventId);
    if (!e) {
      e = await this.repo.create({eventId: eventData.EventId});
    }
    if (await this.updateFromITFAPI(e, eventData)) {
      e.tournament = et;
      const eventRating = await this.eventRatingService.rateEvent(et, e);
      e.eventRating = eventRating;
      return await this.repo.save(e);
    } else {
      return null;
    }
  }

  async updateFromITFAPI(e: ExternalEvent, d: any): Promise<boolean> {
    const logger = getLogger('itfapi');
    /* Figure gender from player type and possibly skip mixed doubles event results*/
    e.gender = null;
    switch (d.PlayerType) {
      case 'M':
      case 'B':
        e.gender = 'M';
        break;
      case 'W':
      case 'G':
        e.gender = 'F';
        break;
      default:
        // not handling mixed doubles events for now.
        logger.error('Skipping event: ' + d.EventId + '. Unknown PlayerType: ' + d.PlayerType);
        return false;
    }
    e.discipline = null;
    switch (d.MatchType) {
      case 'S':
        e.discipline = 'Singles';
        break;
      case 'D':
        e.discipline = 'Doubles';
        break;
      default:
        // not handling mixed doubles events for now. (MatchType = X believe it or not)
        logger.error('Skipping event: ' + d.EventId +
          '. Unknown MatchType: ' + d.MatchType +
          ' (probably mixed doubles).');
        return false;
    }

    // "Events" are sometimes really draws or sub draws like mains and qualifiers.
    // For Tennis Canada rankings purposes, we are only really interested in main draws.
    // But we do want to keep results of other draw types (for some unknown reason)
    // So we mark non-main draws with ignoreResults flag if it is not a main.
    // Note to future self - this really only applies to Junior events. With pros
    // (at least after 2019) we are awarding points on a straight "exchange rate" basis
    // so if a player earns points in qualifiers, they still get Canadian Open ranking points.
    e.ignoreResults = (d.Classification !== 'M');
    e.name = d.Name;
    e.drawSize = d.DrawSize;
    e.manuallyCreated = false;

    if (d.AgeCategory) {
      switch (d.AgeCategory) {
        case '18U':
          e.eventType = 'U18';
          break;
        case '16U':
          e.eventType = 'U16';
          break;
        case '14U':
          e.eventType = 'U14';
          break;
        case '12U':
          e.eventType = 'U12';
          break;
        default:
          // we only deal with events for the above age categories so
          // log the fact that we hit an unexpected one and cancel loading
          // this event and event result and match results.
          logger.error('Skipping event: ' + d.EventId + '. Unknown AgeCategory: ' + d.AgeCategory);
          return false;
      }
    } else {
      e.eventType = 'Open';
    }
    return true;
  }

  // Update the ratings for the events in a tournament.  This is generally
  // triggerd by someone updating the tournament's subCategory.
  // TODO This seems not to belong here but in the external tournament.
  // TODO Probably broke this 2019-01-14 but that is good because it needs proper fixing.
  async updateRating(et: ExternalTournament) {
    for (const ee of et.externalEvents) {
      const eventRating = await this.eventRatingService.rateEvent(et, ee);
      if (eventRating) ee.eventRating = eventRating;
      await this.repo.save(ee);
    }
  }
}
