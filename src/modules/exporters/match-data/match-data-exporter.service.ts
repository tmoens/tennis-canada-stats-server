import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {getLogger, Logger} from 'log4js';
import {ConfigurationService} from '../../configuration/configuration.service';
import {JobState, JobStats} from '../../../utils/jobstats';
import {utils, WorkBook, WorkSheet, writeFile} from 'xlsx';
import {MatchPlayer} from '../../vrtournaments/match_player/match_player.entity';
import {Match} from '../../vrtournaments/match/match.entity';
import {Tournament} from '../../vrtournaments/tournament/tournament.entity';
import {Event} from '../../vrtournaments/event/event.entity';
import * as moment from 'moment';

const TOURNAMENT_URL_PREFIX = 'https://tc.tournamentsoftware.com/sport/tournament.aspx?id=';

@Injectable()
export class MatchDataExporterService {
  private utrReportStats: JobStats;
  private itfReportStats: JobStats;

  constructor(
      private readonly config: ConfigurationService,
      @InjectRepository(Tournament)
      private readonly repository: Repository<Tournament>,
  ) {
    this.utrReportStats = new JobStats('BuildUTRReport');
    this.itfReportStats = new JobStats('ITFMatchExport');
  }

  // ================= For UTR ============================
  // build a report of all the matches in all the tournaments
  // at a national, regional or provincial level from any tournament
  // that has been uploaded in the last however many days
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
            reportData.push(JSON.parse(JSON.stringify(reportLine)));
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

  getBuildReportStats(): JobStats {
    return this.utrReportStats;
  }
}
export class UTRLine {
  matchId: string = null;
  date: string = null;
  w1Name: string = null;
  w1Id: number = null;
  w1Gender: string = null;
  w1YOB: number = null;
  w1City: string = null;
  w1State: string = null;
  w1Country: string = 'CAN';
  w1College: string = null;
  w2Name: string = null;
  w2Id: number = null;
  w2Gender: string = null;
  w2YOB: number = null;
  w2City: string = null;
  w2State: string = null;
  w2Country: string = 'CAN';
  w2College: string = null;
  l1Name: string = null;
  l1Id: number = null;
  l1Gender: string = null;
  l1YOB: number = null;
  l1City: string = null;
  l1State: string = null;
  l1Country: string = 'CAN';
  l1College: string = null;
  l2Name: string = null;
  l2Id: number = null;
  l2Gender: string = null;
  l2YOB: number = null;
  l2City: string = null;
  l2State: string = null;
  l2Country: string = 'CAN';
  l2College: string = null;
  score: string = null;
  idType: string = 'Canada';
  drawName: string = null;
  drawGender: string = null;
  drawTeamType: string = null;
  drawBracketType: string = null;
  drawBracketValue: string = null;
  drawType: string = null;
  tName: string = null;
  tURL: string = null;
  tStartDate: string = null;
  tEndDate: string = null;
  tCity: string = null;
  tState: string = null;
  tCountry: string = 'Canada';
  tCountryCode: string = 'CAN';
  tHost: string = null;
  tLocationType: string = null;
  tSurface: string = null;
  tEventType: string = 'Tournament';
  tEventCategory: string = null;
  tEventGrade: string = null;
  tImportSource: string = 'Tennis Canada';
  tSanctionBody: string = null;

  constructor() {
  }

  dataFill(t: Tournament, e: Event, m: Match, stats: JobStats, logger: Logger): boolean {
    // Not interested in byes
    // i.e. where there is less than two participants for singles or 4 for doubles

    let w1: MatchPlayer;
    let l1: MatchPlayer;
    let w2: MatchPlayer;
    let l2: MatchPlayer;
    for (const mp of m.matchPlayers) {
      if (m.winnerCode === mp.team) {
        if (mp.position === 1) {
          w1 = mp;
        } else {
          w2 = mp;
        }
      } else {
        if (mp.position === 1) {
          l1 = mp;
        } else {
          l2 = mp;
        }
      }
    }

    this.matchId = [t.tournamentCode, m.vrEventCode, m.vrDrawCode, m.vrMatchCode].join('-');
    this.date = moment(t.endDate).format('MM/DD/YYYY');
    if (!w1) {
      stats.bump('no w1');
      return false;
    } else if (0 === w1.playerId) {
      stats.bump('unknown w1');
      return false;
    } else {
      this.w1City = w1.player.city;
      this.w1Name = w1.player.lastName + ', ' + w1.player.firstName;
      this.w1Id = w1.playerId;
      this.w1Gender = w1.player.gender;
      if (w1.player.DOB) {
        this.w1YOB = Number(w1.player.DOB.slice(0, 4));
      } else {
        logger.error(`UTR Reporter noticed player with no DOB. Id: ${w1.player.playerId}`);
        stats.bump('player with no DOB');
      }
      this.w1City = w1.player.city;
      this.w1State = w1.player.province;
    }
    if (!l1) {
      stats.bump('no l1');
      return false;
    } else if (0 === l1.playerId) {
      stats.bump('unknown l1');
      return false;
    } else {
      this.l1City = l1.player.city;
      this.l1Name = l1.player.lastName + ', ' + l1.player.firstName;
      this.l1Id = l1.playerId;
      this.l1Gender = l1.player.gender;
      if (l1.player.DOB) {
        this.l1YOB = Number(l1.player.DOB.slice(0, 4));
      } else {
        logger.error(`UTR Reporter noticed player with no DOB. Id: ${l1.player.playerId}`);
        stats.bump('player with no DOB');
      }
      this.l1City = l1.player.city;
      this.l1State = l1.player.province;
    }

    /* 2022-04-06
     * The "events" in leagues are really divisions in which the "matches" are in fact
     * groups of matches between teams. So, events in leagues cannot be designated as
     * singles or doubles because the groups of matches in the event may contain both
     * singles and doubles matches.
     * Consequently, for 4 players, because we cannot know apriori if the match is
     * singles or doubles.
     */
    if (t.isLeague()) {
      if (w2) {
        if (0 === w2.playerId) {
          stats.bump('unknown w2');
          return false;
        } else {
          this.w2City = w2.player.city;
          this.w2Name = w2.player.lastName + ', ' + w2.player.firstName;
          this.w2Id = w2.playerId;
          this.w2Gender = w2.player.gender;
          if (w2.player.DOB) {
            this.w2YOB = Number(w2.player.DOB.slice(0, 4));
          } else {
            logger.error(`UTR Reporter noticed player with no DOB. Id: ${w2.player.playerId}`);
            stats.bump('player with no DOB');
          }
          this.w2City = w2.player.city;
          this.w2State = w2.player.province;
        }
      }
      if (l2) {
        if (0 === l2.playerId) {
          stats.bump('unknown l2');
          return false;
        } else {
          this.l2City = l2.player.city;
          this.l2Name = l2.player.lastName + ', ' + l2.player.firstName;
          this.l2Id = l2.playerId;
          this.l2Gender = l2.player.gender;
          if (l2.player.DOB) {
            this.l2YOB = Number(l2.player.DOB.slice(0, 4));
          } else {
            logger.error(`UTR Reporter noticed player with no DOB. Id: ${l2.player.playerId}`);
            stats.bump('player with no DOB');
          }
          this.l2City = l2.player.city;
          this.l2State = l2.player.province;
        }
      }
    }

    /*
     * It's not a league, it's a tournament, so we know there should be a w2 and a l2 for
     * doubles (i.e. non singles) events.
     */
    else if (!e.isSingles) {
      if (!w2) {
        stats.bump('no w2');
        return false;
      } else if (0 === w2.playerId) {
        stats.bump('unknown w2');
        return false;
      } else {
        this.w2City = w2.player.city;
        this.w2Name = w2.player.lastName + ', ' + w2.player.firstName;
        this.w2Id = w2.playerId;
        this.w2Gender = w2.player.gender;
        if (w2.player.DOB) {
          this.w2YOB = Number(w2.player.DOB.slice(0, 4));
        } else {
          logger.error(`UTR Reporter noticed player with no DOB. Id: ${w2.player.playerId}`);
          stats.bump('player with no DOB');
        }
        this.w2City = w2.player.city;
        this.w2State = w2.player.province;
      }
      if (!l2) {
        stats.bump('no l2');
        return false;
      } else if (0 === l2.playerId) {
        stats.bump('unknown l2');
        return false;
      } else {
        this.l2City = l2.player.city;
        this.l2Name = l2.player.lastName + ', ' + l2.player.firstName;
        this.l2Id = l2.playerId;
        this.l2Gender = l2.player.gender;
        if (l2.player.DOB) {
          this.l2YOB = Number(l2.player.DOB.slice(0, 4));
        } else {
          logger.error(`UTR Reporter noticed player with no DOB. Id: ${l2.player.playerId}`);
          stats.bump('player with no DOB');
        }
        this.l2City = l2.player.city;
        this.l2State = l2.player.province;
      }
    }
    this.score = m.score;
    this.drawGender = e.genderId;
    this.drawTeamType = (e.isSingles) ? 'Singles' : 'Doubles';
    if (e.vrRankingsCategory) {
      this.drawBracketType = e.vrRankingsCategory.vrRankingsType.typeName;
      switch (this.drawBracketType) {
        case 'Senior':
          this.drawBracketValue = e.minAge + ' & O';
          break;
        case 'Junior':
          this.drawBracketValue = 'U' + e.maxAge;
          break;
        case 'Adult':
          this.drawBracketValue = e.level.toString();
          break;
      }
    }
    this.tName = t.name;
    this.tURL = TOURNAMENT_URL_PREFIX + t.tournamentCode;
    this.tStartDate = moment(t.startDate).format('MM/DD/YYYY');
    this.tEndDate = moment(t.endDate).format('MM/DD/YYYY');
    this.tCity = t.city;
    this.tState = t.license.province;
    this.tHost = t.license.licenseName;
    this.tEventCategory = t.level;
    this.tEventGrade = e.grade;
    this.tSanctionBody = t.license.province;
    return true;
  }
}

export class ITFMatchDTO {
  MatchID: string = null;
  Side1Player1ID: string = null;
  Side1Player2ID: string = null;
  Side2Player1ID: string = null;
  Side2Player2ID: string = null;
  MatchWinner: number = null;
  SurfaceType: string = 'H';
  Score: string = null;
  MatchStatus: string = null;
  ScoreSet1Side1: number = null;
  ScoreSet1Side2: number = null;
  ScoreSet1WinningTieBreak: number = null;
  ScoreSet1LosingTieBreak: number = null;
  ScoreSet2Side1: number = null;
  ScoreSet2Side2: number = null;
  ScoreSet2WinningTieBreak: number = null;
  ScoreSet2LosingTieBreak: number = null;
  ScoreSet3Side1: number = null;
  ScoreSet3Side2: number = null;
  ScoreSet3WinningTieBreak: number = null;
  ScoreSet3LosingTieBreak: number = null;
  ScoreSet4Side1: number = null;
  ScoreSet4Side2: number = null;
  ScoreSet4WinningTieBreak: number = null;
  ScoreSet4LosingTieBreak: number = null;
  ScoreSet5Side1: number = null;
  ScoreSet5Side2: number = null;
  ScoreSet5WinningTieBreak: number = null;
  ScoreSet5LosingTieBreak: number = null;
  MatchType: string = null;
  TournamentID: string = null;
  TournamentName: string = null;
  MatchStartDate: string = null;
  MatchEndDate: string = null;
  TournamentStartDate: string = null;
  TournamentEndDate: string = null;
  AgeCategoryCode: string = null;
  IndoorFlag: boolean = false;
  Grade: string = null;
  MatchFormat: string = null;

  constructor() {
  }

  dataFill(t: Tournament, e: Event, m: Match): boolean {
    let p11: MatchPlayer;
    let p12: MatchPlayer;
    let p21: MatchPlayer;
    let p22: MatchPlayer;
    for (const mp of m.matchPlayers) {
      if (1 === mp.team && 1 === mp.position) p11 = mp;
      if (1 === mp.team && 2 === mp.position) p12 = mp;
      if (2 === mp.team && 1 === mp.position) p21 = mp;
      if (2 === mp.team && 2 === mp.position) p22 = mp;
    }
    // Not interested in byes
    // i.e. where there is less than two participants for singles or 4 for doubles
    if (!p11 || !p21) return false;
    if (!e.isSingles && (!p12 || !p22)) return false;

    this.MatchID = [t.tournamentCode, m.vrEventCode, m.vrDrawCode, m.vrMatchCode].join('-');
    this.Side1Player1ID = p11.playerId.toString();
    this.Side2Player1ID = p21.playerId.toString();
    if (!e.isSingles) {
      this.Side1Player2ID = p12.playerId.toString();
      this.Side2Player2ID = p22.playerId.toString();
    }
    this.MatchWinner = m.winnerCode;
    // Skipping this.SurfaceType as we don't have the data - defaults to 'H'
    this.Score = m.score;
    // Skipping this.MatchStatus
    // Skipping the score breakdown fields
    this.MatchType = (e.isSingles) ? 'S' : 'D';
    this.TournamentID = t.tournamentCode;
    this.TournamentName = t.name;
    // We do not have match dates, so we use the tournament end date.
    this.MatchStartDate = t.endDate;
    this.MatchEndDate = t.endDate;
    this.TournamentStartDate = t.startDate;
    this.TournamentEndDate = t.endDate;
    if (e.vrRankingsCategory) {
      this.AgeCategoryCode = e.vrRankingsCategory.categoryId;
    }
    // Skipping this.IndoorCode - defaults to false;
    this.Grade = e.grade + '(' + e.winnerPoints.toString() + ')';
    return true;
  }
}
