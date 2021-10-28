import {Injectable} from '@nestjs/common';
import {InjectConnection} from '@nestjs/typeorm';
import {Connection, Repository} from 'typeorm';
import {CalendarTournament} from './calendar-tournament.entity';
import {TournamentService} from '../vrtournaments/tournament/tournament.service';
import {Tournament} from '../vrtournaments/tournament/tournament.entity';
import {ConfigurationService} from '../configuration/configuration.service';
import {JobState, JobStats} from '../../utils/jobstats';
import {CalendarEvent} from './calendar-event.entity';
import {getLogger, Logger} from 'log4js';

const logger: Logger = getLogger('calendarDbSync');

@Injectable()
export class CalendarService {
  tournamentRepo: Repository<CalendarTournament>;
  eventRepo: Repository<CalendarEvent>;
  jobStats: JobStats = new JobStats('calendarDbSync');

  constructor(
    private readonly configService: ConfigurationService,

    // The next two lines were how we were "supposed" to get the repos.
    // Unfortunately they were not working so we grabbed the connection and got the repos from it.
    // @InjectRepository(CalendarTournament) private readonly tournamentRepo: Repository<CalendarTournament>,
    // @InjectRepository(CalendarEvent) private readonly eventRepo: Repository<CalendarEvent>,

    @InjectConnection('calendar') private readonly connection: Connection,
    private readonly tournamentService: TournamentService,
  ) {
    this.jobStats = new JobStats('calendarDbSync');
    this.jobStats.setStatus(JobState.NOT_STARTED);
  }

  // Sync the tournaments and events in the calendar db with those from the tc_stats db
  async sync(): Promise<boolean> {
    this.tournamentRepo = this.connection.getRepository(CalendarTournament);
    this.eventRepo = this.connection.getRepository(CalendarEvent);
    this.jobStats = new JobStats('calendarDbSync');
    this.jobStats.setStatus(JobState.IN_PROGRESS);

    // go get all the tournaments that have been updated in the sync window
    let d = new Date();
    d = new Date(d.setDate(d.getDate() - this.configService.calendarDbSyncPeriod));
    const updatedSinceString = d.toISOString().substr(0, 10);
    const tournaments: Tournament[] = await this.tournamentService.getTournamentsUpdatedSince(updatedSinceString);
    this.jobStats.toDo = tournaments.length;
    this.jobStats.setCounter('done', 0);

    for (const t of tournaments) {
      // see if the tournament is in the calendar db
      const calendarT: CalendarTournament = await this.tournamentRepo.createQueryBuilder('t')
        .where(`t.tournamentCode = '${t.tournamentCode}'`)
        .getOne();

      // CASE 1: the tournament is not in the calendar db
      if (!calendarT) {
        const tournament: Tournament = await this.tournamentService.getTournamentWithEventsAndLicense(t.tournamentCode);
        await this.createCalendarTournamentFromTournament(tournament);
        this.jobStats.bump('tournamentsAdded');
      } else {

        if (calendarT.lastUpdated.toISOString() !== t.lastUpdatedInVR.toISOString()) {

          // CASE 2: the tournament is in the calendar DB but it is out of date
          // delete it fom the calendar db, then re-add it.
          await this.tournamentRepo.remove(calendarT);
          const tournament: Tournament = await this.tournamentService.getTournamentWithEventsAndLicense(t.tournamentCode);
          await this.createCalendarTournamentFromTournament(tournament);
          this.jobStats.bump('tournamentsUpdated');
        } else {

          // CASE 3: the tournament is there and up to date, but maybe the province can be updated
          if (calendarT.province !== t.license.province) {
            calendarT.province = t.license.province;
            await this.tournamentRepo.save(calendarT);
            this.jobStats.bump('tournamentProvinceUpdated');
          } else {

            // CASE 4: All is well.
            this.jobStats.bump('tournamentAlreadyUpToDate');
          }
        }
      }
      this.jobStats.bump('done');
      if (this.jobStats.get('done') % 100 === 0) {
        logger.info(`${this.jobStats.get('done')} tournaments synced to the calendar database.`)
      }
    }

    this.jobStats.setStatus(JobState.DONE);
    return true;
  }

  async createCalendarTournamentFromTournament(t: Tournament,): Promise<CalendarTournament> {
    let ct = new CalendarTournament();
    ct.tournamentCode = t.tournamentCode;
    ct.name = t.name;
    ct.level = t.level;
    ct.typeId = t.typeId;
    ct.licenseName = t.license.licenseName;
    ct.city = t.city;
    ct.province = t.license.province;
    ct.lastUpdated = t.lastUpdatedInVR;
    ct.startDate = t.startDate;
    ct.endDate = t.endDate;
    ct =  await this.tournamentRepo.save(ct);
    for (const e of t.events) {
      // we only deal with events that have a known rankings category
      if (!e.vrRankingsCategory) {
        continue;
      }
      let ce = new CalendarEvent();
      ce.categoryId = e.vrRankingsCategory.categoryId;
      ce.tournament = ct;
      ce.eventCode = e.eventCode;
      ce.name = e.name;
      ce.level = e.level;
      ce.isSingles = e.isSingles;
      ce.minAge = e.minAge;
      ce.maxAge = e.maxAge;
      ce.genderId = e.genderId;
      ce.winnerPoints = e.winnerPoints;
      ce.rosterSize = e.numberOfEntries;
      ce.grade = e.grade;
      ce = await this.eventRepo.save(ce);
    }
    return await this.tournamentRepo.findOne(ct.tournamentId);
  }
}
