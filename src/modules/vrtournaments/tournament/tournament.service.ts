import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from './tournament.entity';
import { VRAPIService } from '../../VRAPI/vrapi.service';
import { EventService } from '../event/event.service';
import { getLogger } from 'log4js';
import { License } from '../license/license.entity';
import { LicenseService } from '../license/license.service';
import { ConfigurationService } from '../../configuration/configuration.service';
import { JobStats, JobState } from '../../../utils/jobstats';

const CREATION_COUNT = 'tournaments_created';
const UPDATE_COUNT = 'tournaments_updated';
const UP_TO_DATE_COUNT = 'tournaments_already_up_to_date';
const SKIP_COUNT = 'tournaments_skipped';
const DONE = 'done';
const logger = getLogger('tournamentService');

@Injectable()
export class TournamentService {
  private importStats: JobStats;
  constructor(
    private readonly config: ConfigurationService,
    @InjectRepository(Tournament)
    private readonly repository: Repository<Tournament>,
    private readonly eventService: EventService,
    private readonly licenseService: LicenseService,
    private readonly vrapi: VRAPIService,

  ) {
    this.importStats = new JobStats('tournamentImport');
  }

  async findAll(): Promise<Tournament[]> {
    return await this.repository.find();
  }

  // update the ts_stats_server database wrt tournaments.
  // Add any ones we did not know about and update any ones we
  // did know about, if our version is out of date.
  async importTournamentsFromVR() {
    const importLogger = getLogger('tournamentImport');
    importLogger.info('**** VR Tournament Import started.');
    this.importStats = new JobStats('tournamentImport');
    this.importStats.setStatus(JobState.IN_PROGRESS);
    // TODO - this needs to be done in a loop from start to this year

    // Ask the API for a list of tournaments since a configured start time
    // The API responds with an array an object containing only one item called
    // Tournament which is an array of mini tournamentId records.
    const miniTournaments = await this.vrapi.get('Tournament/Year/' + this.config.tournamentUploadStartYear);

    importLogger.info (miniTournaments.Tournament.length + ' tournaments found');
    const tournamentCount: number = miniTournaments.Tournament.length;
    // the next line is not strictly true as many will be skipped and there
    // may be an import limit (but only during testing.  But it is a reasonable guess.
    this.importStats.toDo = tournamentCount;

    for (let i = 0; i < tournamentCount; i++) {
      const miniTournament = miniTournaments.Tournament[i];

      // Skipping leagues and team tennis for now.
      if ('0' !== miniTournament.TypeID) {
        this.importStats.bump(SKIP_COUNT);
        importLogger.info('Skipping team tournament or league. ' + miniTournament.Name + ' Code: ' + miniTournament.Code);
        continue;
      }

      // go see if we already have a record of the tournamentId.  If not make a new one
      const tournament: Tournament = await
        this.repository.findOne({tournamentCode: miniTournament.Code});
      if (null == tournament) {
        importLogger.info('Creating: ' + JSON.stringify(miniTournament));
        await this.createTournamentFromVRAPI(miniTournament.Code);
        this.importStats.bump(CREATION_COUNT);
      }

      // if our version is out of date, torch it and rebuild
      else if (tournament.isOutOfDate(miniTournament.LastUpdated)) {
        importLogger.info('Updating: ' + JSON.stringify(miniTournament));
        await this.repository.remove(tournament);
        await this.createTournamentFromVRAPI(miniTournament.Code);
        this.importStats.bump(UPDATE_COUNT);
      }

      // otherwise, our version is up to date and we can skip along.
      else {
        this.importStats.bump(UP_TO_DATE_COUNT);
      }

      this.importStats.bump(DONE);

      // Break out early, but really only used during development.
      if (this.importStats.get(CREATION_COUNT) >= this.config.tournamentUploadLimit) break;
    }
    this.importStats.setStatus(JobState.DONE);
    importLogger.info('VR Tournament Import info: ' + JSON.stringify(this.importStats));
    importLogger.info('**** VR Tournament Import done.');
    return;
  }

  async createTournamentFromVRAPI(tournamentCode: string): Promise<boolean> {
    const tournament = new Tournament();
    let apiTournament = await this.vrapi.get('Tournament/' + tournamentCode);

    // sluff off the outer layer of the returned object.
    apiTournament = apiTournament.Tournament;

    // Lookup the license - this is the only reliable way to get the
    // province for the tournament.
    const license: License = await this.licenseService.lookupOrCreate(apiTournament.Organization.Name);

    // Create the tournament object.
    tournament.buildFromVRAPIObj(apiTournament);
    tournament.license = license;
    await this.repository.save(tournament);

    // Now dig down and import the events for this tournament
    await this.eventService.importEventsFromVR(tournament, this.importStats);
    return true;
  }

  getImportStatus(): string {
    return JSON.stringify(this.importStats);
  }
}