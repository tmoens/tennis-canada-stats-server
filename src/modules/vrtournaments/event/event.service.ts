import {Inject, Injectable} from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm';
import {EntityManager, Repository} from 'typeorm';
import { Event } from './event.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {Tournament} from "../tournament/tournament.entity";
import {getLogger} from "log4js";
import {PlayerService} from "../../player/player.service";
import {DrawService} from "../draw/draw.service";
import {JobStats} from "../../../utils/jobstats";

const CREATION_COUNT = "event_creation";
const logger = getLogger("eventService");

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,
    private readonly drawService: DrawService,
    private readonly playerService: PlayerService,
    private readonly vrapi: VRAPIService,
    @InjectEntityManager()
    private readonly entityManager: EntityManager,) {
  }

  async findAll(): Promise<Event[]> {
    return await this.repository.find();
  }

  // go get all the events for a given tournament from the VR API.
  async importEventsFromVR(tournament: Tournament, importStats: JobStats): Promise<boolean> {
    let events = await this.vrapi.get("Tournament/" + tournament.tournamentCode + "/Event");
    // console.log("Events: \n" + JSON.stringify(events));

    // Because the xml2js parser is configured not to convert every single
    // child node into an array (explicitArray: false), it only creates an
    // array of TournamentEvent s if there is more than one.
    // We want an array regardless of whether the tournament has 0, 1 or more events
    if (null == events.TournamentEvent) {
      events = [];
    } else if (Array.isArray(events.TournamentEvent)) {
      events = events.TournamentEvent;
    } else {
      events = [events.TournamentEvent];
    }
    logger.info(events.length + " events found");

    let e: Event;
    // go and create the events
    for (let i = 0; i < events.length; i++) {
      e = new Event();
      e.buildFromVRAPIObj(events[i]);
      e.tournament = tournament;
      e.draws = [];
      e.matches = [];
      await this.repository.save(e);

      // Now dig down and load the draws for this event.
      await this.drawService.importDrawsFromVR(e, importStats);


      importStats.bump(CREATION_COUNT);
    }
    return true;
  }

  async getRoster(eventId): Promise<any[]> {
    const roster  = await this.entityManager.query(
      'select DISTINCTROW p.* from event e\n' +
      'LEFT JOIN `match` m ON e.eventId = m.eventId\n' +
      'LEFT JOIN matchplayer mp ON m.matchId = mp.matchId\n' +
      'LEFT JOIN player p ON mp.playerId = p.playerId\n' +
      'WHERE e.eventId = 9;');
    return roster;
  }
}
