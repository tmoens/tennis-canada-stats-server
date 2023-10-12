import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {getLogger, Logger} from 'log4js';
import {ConfigurationService} from '../../configuration/configuration.service';
import {JobState, JobStats} from '../../../utils/jobstats';
import {utils, WorkBook, WorkSheet, writeFile} from 'xlsx';
import {Tournament} from '../../vrtournaments/tournament/tournament.entity';
import * as moment from 'moment';
import {UTRLine} from './utr/u-t-r.line';
import {MatchCompetitivenessLine} from './match-competitiveness-report/match-competitiveness-line';

export const TOURNAMENT_URL_PREFIX = 'https://tc.tournamentsoftware.com/sport/tournament.aspx?id=';

@Injectable()
export class MatchDataExporterService {
  private utrReportStats: JobStats;
  private mqReportStats: JobStats;

  constructor(
    private readonly config: ConfigurationService,
    @InjectRepository(Tournament)
    private readonly repository: Repository<Tournament>,
  ) {
    this.utrReportStats = new JobStats('BuildUTRReport');
    this.mqReportStats = new JobStats('MatchCompetitivenessReport');
  }

  // ================= For UTR ============================
  // build a report of all the matches in all the tournaments
  // at a national, regional or provincial level from any tournament
  // that has been uploaded in the last however many days
  // TODO Consider improving this to match the way the competitiveness report is done.
  async buildUTRReport(): Promise<JobStats> {
    const logger: Logger = getLogger('UTRReporter');
    logger.info('Querying UTR Data.');
    this.utrReportStats = new JobStats('BuildUTRReport');
    this.utrReportStats.setStatus(JobState.IN_PROGRESS);
    this.utrReportStats.setCurrentActivity('Querying UTR Data Report');
    let d = new Date();
    const nowDateString = d.toISOString().slice(0, 10);
    d = new Date(d.setDate(d.getDate() - this.config.utrReportGoesBackInDays));
    const updatedSinceString = d.toISOString().slice(0, 10);
    logger.info('Querying UTR Data for tournaments updated since ' + updatedSinceString);

    const tournaments: Tournament[] = await this.repository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.events', 'e')
      .leftJoinAndSelect('t.license', 'l')
      .leftJoinAndSelect('e.vrRankingsCategory', 'rCat')
      .leftJoinAndSelect('rCat.vrRankingsType', 'rType')
      .leftJoinAndSelect('e.matches', 'm')
      .leftJoinAndSelect('m.matchPlayers', 'mp')
      .leftJoinAndSelect('mp.player', 'p')
      .where(`t.endDate <= '${nowDateString}'`)
      .andWhere(`t.tcUpdatedAt > '${updatedSinceString}'`)
      .andWhere('t.level IN ("National","Provincial","Regional")')
      .getMany();

    logger.info('Building UTR Report.');
    this.utrReportStats.setCurrentActivity('Building UTR Report');
    const reportData: any[] = [];

    // loop through the tournaments (and leagues)
    for (const t of tournaments) {
      this.utrReportStats.bump('tournaments');
      logger.info(`UTR reporting: tournament ${t.tournamentCode} ${t.startDate}`)
      for (const e of t.events) {
        this.utrReportStats.bump('events');

        // For Tournaments, skip events without a ranking category
        // This should eliminate all underage (U10 and below) and co-ed events
        // For Leagues - events do not have rankings categories and should not be skipped
        if (t.isTournament() && null === e.vrRankingsCategory) {
          this.utrReportStats.bump('eventsWithoutCategoriesSkipped');
          continue;
        }
        // Just in case the TD created an event as a U12 rankings category event but put an
        // age level restriction under 10 or below, skip the event.
        if (t.isTournament() && 'Junior' === e.vrRankingsCategory.vrRankingsType.typeName && e.maxAge < 12) {
          this.utrReportStats.bump('U10AndBelowSkipped');
          continue;
        }

        // For leagues don't take any "events" that are younger than under 12
        if (t.isLeague() && e.maxAge && e.maxAge < 11) {
          this.utrReportStats.bump('U10AndBelowSkipped');
          continue;
        }

        for (const m of e.matches) {
          this.utrReportStats.bump('matches');
          const reportLine = new UTRLine();
          if (reportLine.dataFill(t, e, m, this.utrReportStats, logger)) {
            reportData.push(JSON.parse(JSON.stringify(reportLine, null, 2)));
          }
        }
      }
    }
    logger.info('Writing UTR Report.');
    this.utrReportStats.setCurrentActivity('Writing UTR Report');
    const wb: WorkBook = utils.book_new();
    wb.Props = {
      Title: 'Tennis Canada Event Ratings',
    };
    let reportSheet: WorkSheet = await utils.json_to_sheet([], {
      header:
        ['Match ID', 'Date',
          'Winner 1 Name', 'Winner 1 Third Party ID', 'Winner 1 Gender', 'Winner 1 DOB',
          'Winner 1 City', 'Winner 1 State', 'Winner 1 Country', 'Winner 1 College',
          'Winner 2 Name', 'Winner 2 Third Party ID', 'Winner 2 Gender', 'Winner 2 DOB',
          'Winner 2 City', 'Winner 2 State', 'Winner 2 Country', 'Winner 2 College',
          'Loser 1 Name', 'Loser 1 Third Party ID', 'Loser 1 Gender', 'Loser 1 DOB',
          'Loser 1 City', 'Loser 1 State', 'Loser 1 Country', 'Loser 1 College',
          'Loser 2 Name', 'Loser 2 Third Party ID', 'Loser 2 Gender', 'Loser 2 DOB',
          'Loser 2 City', 'Loser 2 State', 'Loser 2 Country', 'Loser 2 College',
          'Score', 'Id Type',
          'Draw Name', 'Draw Gender', 'Draw Team Type', 'Draw Bracket Type', 'Draw Bracket Value', 'Draw Type',
          'Tournament Name', 'Tournament URL', 'Tournament Start Date', 'Tournament End Date',
          'Tournament City', 'Tournament State', 'Tournament Country', 'Tournament Country Code',
          'Tournament Host', 'Tournament Location Type', 'Tournament Surface', 'Tournament Event Type',
          'Tournament Event Category', 'Tournament Event Grade', 'Tournament Import Source', 'Tournament Sanction Body',
        ],
    });
    reportSheet = await utils.sheet_add_json(reportSheet, reportData, {
      skipHeader: true,
      origin: 'A2',
    });
    utils.book_append_sheet(wb, reportSheet, 'Matches');
    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `${this.config.utrReportDirectory}/UTR_Report_${now}.xlsx`;
    await writeFile(wb, filename);
    this.utrReportStats.data = {filename};

    logger.info('Finished UTR Report');
    this.utrReportStats.setCurrentActivity('Finished UTR Report');
    this.utrReportStats.setStatus(JobState.DONE);
    return this.utrReportStats;
  }

  // ================= For Match Competitiveness Report ============================
  // build a report of all the matches in all the tournaments, leagues and box leagues
  // since a given date
  async buildMatchCompetitivenessReport() {
    const logger: Logger = getLogger('MatchCompetitivenessReporter');
    logger.info('Querying Data.');
    this.mqReportStats = new JobStats('Build Match Competitiveness Report');
    this.mqReportStats.setStatus(JobState.IN_PROGRESS);
    this.mqReportStats.setCurrentActivity('Building "Match Competitiveness" report');
    const tournamentsWithoutMatches: { code: string, name: string, endDate: string }[] = [];

    const wb: WorkBook = await utils.book_new();
    wb.Props = {
      Title: 'Tennis Canada Match Competitiveness',
    };

    let reportSheet: WorkSheet;
    let reportRow = 2; // 2 because a- Excel counts from 1 and b- there is a header row.

    // Initially, I wrote a query to get everything.  The Query took a very long time,
    // and it would get longer and use more memory as time goes by.  So I broke it
    // into two parts.
    // First, get the set of tournaments that are of interest.
    // Second process them one by one.
    // Overall it is slower but this way The server is never blocked for very long.

    // Part 1: get all the tournaments of interest
    const tournaments: Tournament[] = await this.repository
      .createQueryBuilder('t')
      .where(`t.endDate > '2021-12-31' AND t.typeId != 1`)
      .getMany();
    this.mqReportStats.toDo = tournaments.length;
    logger.info(`Building Match Competitiveness Report. ${tournaments.length} Tournaments.`);

    // Part 2: Go get all the match data for one tournament at a time.
    // let testingLimit = 30;
    for (const tournament of tournaments) {
      // if (testingLimit-- === 0) { break; }
      const reportData: any[] = [];
      this.mqReportStats.setData('nowProcessing', tournament.name);
      const t: Tournament = await this.repository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.events', 'e')
        .leftJoinAndSelect('t.license', 'l')
        .leftJoinAndSelect('e.vrRankingsCategory', 'rCat')
        .leftJoinAndSelect('rCat.vrRankingsType', 'rType')
        .leftJoinAndSelect('e.matches', 'm')
        .leftJoinAndSelect('m.matchPlayers', 'mp')
        .leftJoinAndSelect('mp.player', 'p')
        .where(`t.tournamentCode = '${tournament.tournamentCode}'`)
        .getOne();

      for (const e of t.events) {
        for (const m of e.matches) {
          const reportLine = new MatchCompetitivenessLine();
          const res: string = reportLine.dataFill(t, e, m)
          if (res) {
            // How did building a scoreline fail? Let me count the ways.
            this.mqReportStats.bump(res);
          } else {
            reportData.push(JSON.parse(JSON.stringify(reportLine, null, 2)));
          }
          this.mqReportStats.bump('matchesProcessed');
        }
        this.mqReportStats.bump('eventsProcessed');
      }

      // Add tournament results to the report worksheet;
      if (reportData.length > 0) {
        if (!reportSheet) {
          // For the first set of results, we create the worksheet
          // this function causes header rows to be added.
          reportSheet = await utils.json_to_sheet(reportData);
        } else {
          // For subsequent sheets we just add rows, skipping the headers
          reportSheet = await utils.sheet_add_json(reportSheet, reportData, {
            skipHeader: true,
            origin: `A${reportRow}`,
          });
        }
        // remember where to add the next set of matches.
        reportRow = reportRow + reportData.length;
      } else {
        // It turns out that a lot of tournaments do not have matches to report:
        // - many were cancelled, usually COVID related
        //    - some of those have ANULLED CANCELLED in their name
        //    - some do not
        // - some only have under 10 type matches which do not get reported
        // - and there is a chance, I screwed up and did not get the matches
        // Anyway, we might as well capture the list and let Tennis Canada
        // look at them if they want to.
        this.mqReportStats.bump('tournamentsWithoutMatches');
        tournamentsWithoutMatches.push({ code: t.tournamentCode, name: t.name, endDate: t.endDate });
      }
      this.mqReportStats.bump('done');
    }

    this.mqReportStats.setCurrentActivity('Writing Match Competitiveness Report');
    logger.info('Writing MatchCompetitiveness Report.');

    // wait a moment before writing workbook. Just look the other way.
    await new Promise(resolve => setTimeout(resolve, 200));

    utils.book_append_sheet(wb, reportSheet, 'Matches');
    const tournamnetsWithoutMatchesSheet = await utils.json_to_sheet(tournamentsWithoutMatches);
    utils.book_append_sheet(wb, tournamnetsWithoutMatchesSheet, 'TournamentsWithoutMatches');
    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `Reports/MatchCompetitiveness_${now}.xlsx`;
    await writeFile(wb, filename);
    this.mqReportStats.setData('filename', filename);

    logger.info('Finished match competitiveness report');
    this.mqReportStats.setCurrentActivity('Finished Match Competitiveness Report');
    this.mqReportStats.setStatus(JobState.DONE);
    this.mqReportStats.log();
  }

  getBuildUTRReportStats(): JobStats {
    return this.utrReportStats;
  }
  getBuildMatchCompetitivenessReportStats(): JobStats {
    return this.mqReportStats;
  }
}


