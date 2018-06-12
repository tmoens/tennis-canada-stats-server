import {Injectable, forwardRef, Inject} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './tournament.entity'
import {VRAPIService} from "../../VRAPI/vrapi.service";
import {EventService} from "../event/event.service";
import {StatsService} from "../../stats/stats.service";
import {getLogger} from "log4js";
import {License} from "../license/license.entity";
import {LicenseService} from "../license/license.service";

const CREATION_COUNT = "tournament_creation";
const UPDATE_COUNT = "tournament_update";
const UP_TO_DATE_COUNT = "tournament_up_to_date";

const logger = getLogger("tournamentService");

@Injectable()
export class TournamentService {
  constructor(
    @InjectRepository(Tournament)
    private readonly repository: Repository<Tournament>,
    private readonly eventService: EventService,
    private readonly licenseService: LicenseService,
    private readonly statsService: StatsService,
    private readonly vrapi: VRAPIService,

  ) {}

  async findAll(): Promise<Tournament[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database wrt tournaments.
  // Add any ones we did not know about and update any ones we
  // did know about, if our version is out of date.
  async importTournamentsFromVR(since:number = 2018) {
    // Ask the API for a list of tournaments since TODO
    // The API responds with an array an object containing only one item called
    // Tournament which is an array of mini tournamentId records.
    let miniTournaments = await this.vrapi.get("Tournament/Year/2018");
    logger.info (miniTournaments.Tournament.length + " tournaments found");
    let importLimit = 2;

    // This is the top of the import hierarchy so we can clear counters before we start.
    this.statsService.resetAll();

    for (let i = 0; i < miniTournaments.Tournament.length; i++) {
      let miniTournament = miniTournaments.Tournament[i];

      // Skipping leagues and team tennis for now.
      if ("0" != miniTournament.TypeID) {
        logger.info("Skipping team tournament or league. " + miniTournament.Name + " Code: " + miniTournament.Code);
        continue;
      }

      // go see if we already have a record of the tournamentId.  If not make a new one
      let tournament:Tournament = await
        this.repository.findOne({tournamentCode: miniTournament.Code});
      if (null == tournament) {
        logger.info("Creating: " + miniTournament.Name + " Code: " + miniTournament.Code);
        await this.createTournamentFromVRAPI(miniTournament.Code);
        this.statsService.bump(CREATION_COUNT);
      }

      // if our version is out of date, torch it and rebuild
      else if (tournament.isOutOfDate(miniTournament.LastUpdated)) {
        logger.info("Updating: " + miniTournament.Name);
        await this.repository.remove(tournament);
        await this.createTournamentFromVRAPI(miniTournament.Code);
        this.statsService.bump(UPDATE_COUNT);
      }

      // otherwise, our version is up to date and we can skip along.
      else {
        this.statsService.bump(UP_TO_DATE_COUNT);
      }

      // for initial development
      if (this.statsService.get(CREATION_COUNT) >= importLimit) break;
    }

    this.statsService.logAll();
    return this.statsService.get(CREATION_COUNT);
  }

  async createTournamentFromVRAPI(tournamentCode:string): Promise<boolean> {
    let tournament = new Tournament();
    let apiTournament = await this.vrapi.get("Tournament/" + tournamentCode);

    // sluff off the outer layer of the returned object.
    apiTournament = apiTournament.Tournament;

    // Lookup the license - this is the only reliable way to get the
    // province for the tournament.
    let license:License = await this.licenseService.lookupOrCreate(apiTournament.Organization.Name);

    // Create the tournament object.
    tournament.buildFromVRAPIObj(apiTournament)
    tournament.license = license;
    await this.repository.save(tournament);

    // Now dig down and import the events for this tournament
    await this.eventService.importEventsFromVR(tournament);
    return true;
  }
}