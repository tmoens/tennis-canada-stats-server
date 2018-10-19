import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {getLogger} from 'log4js';
import {ConfigurationService} from '../../configuration/configuration.service';
import {JobState, JobStats} from '../../../utils/jobstats';
import {utils, WorkBook, WorkSheet, writeFile} from 'xlsx';
import * as moment from 'moment';
import {MatchPlayer} from '../../vrtournaments/match_player/match_player.entity';
import {Match} from '../../vrtournaments/match/match.entity';
import {Tournament} from '../../vrtournaments/tournament/tournament.entity';
import {Event} from '../../vrtournaments/event/event.entity';
import {SeafileService} from '../../Seafile/seafile.service';

const TOURNAMENT_URL_PREFIX = 'http://tc.tournamentsoftware.com/sport/tournament.aspx?id=';

@Injectable()
export class UtrService {
  constructor(
    private readonly config: ConfigurationService,
    @InjectRepository(Tournament)
    private readonly repository: Repository<Tournament>,
    private readonly seafileAPI: SeafileService,
    ) {}

  // build a report of all the matches in all the tournaments
  // at a national, regional or provincial level from any tournament
  // that has been uploaded in the last however many days
  async buildUTRReport(): Promise<JobStats> {
    const logger = getLogger('UTRReporter');
    logger.info('Querying UTR Data.');
    const stats = new JobStats('BuildUTRReport');
    stats.setStatus(JobState.IN_PROGRESS);
    stats.currentActivity = 'Querying UTR Data Report';
    let d = new Date();
    const nowDateString = d.toISOString().substr(0, 10);
    d = new Date(d.setDate(d.getDate() - 7));
    const updatedSinceString = d.toISOString().substr(0, 10);
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
      .andWhere(`t.tcUpdatedAt > '${updatedSinceString}'` )
      .andWhere('t.level IN ("National","Provincial","Regional")')
      .getMany();

    logger.info('Building UTR Report.');
    stats.currentActivity = 'Building UTR Report';
    const reportData: any[] = [];
    reportData.push(JSON.parse(JSON.stringify(this.makeHeaders())));
    for (const t of tournaments) {
      stats.bump('tournaments');
      for (const e of t.events) {
        stats.bump('events');
        // skip events without a rankingCategory
        if (null === e.vrRankingsCategory) {
          stats.bump('eventsWithoutCategoriesSkipped');
          continue;
        }
        // Skip Junior events for ages U10 and below
        if ('Junior' === e.vrRankingsCategory.vrRankingsType.typeName && e.maxAge < 10) {
          stats.bump('U10AndBelowSkipped');
          continue;
        }
        for (const m of e.matches) {
          stats.bump('matches');
          const reportLine = new UTRLine();
          if (await reportLine.dataFill(t, e, m, stats)) {
            reportData.push(JSON.parse(JSON.stringify(reportLine)));
          }
        }
      }
    }
    logger.info('Writing UTR Report.');
    stats.currentActivity = 'Writing UTR Report';
    const wb: WorkBook = utils.book_new();
    wb.Props = {
      Title: 'Tennis Canada Event Ratings',
    };
    const reportSheet: WorkSheet = await utils.json_to_sheet(reportData, {skipHeader: true});
    utils.book_append_sheet(wb, reportSheet, 'Matches');
    const now = moment().format('YYYY-MM-DD-HH-mm-ss');
    const filename = `Reports/UTR_Report_${now}.xlsx`;
    await writeFile(wb, filename);
    stats.data = {filename};

    logger.info('Uploading UTR Report.');
    stats.currentActivity = 'Uploading UTR Report';
    await this.seafileAPI.uploadFile(filename);

    /* Forgiveness requested.  I tired to get the seafile API
     * to wait for the upload to complete before returning. I failed.
     * If the UTR report was being generated from a
     * main.js (which never exits) - no big deal.
     *
     * But the auto reporter executable DOES exit and it does so after the report
     * writer returns but before the file is actually uploaded.
     *
     * Consequently the upload gets aborted.
     *
     * So I am kludging things so that this process waits a while before
     * returning
     */

    await this.delay(30000);

    logger.info('Finished UTR Report');
    stats.currentActivity = 'Finished UTR Report';
    stats.setStatus(JobState.DONE);
    return stats;
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  makeHeaders(): UTRLine {
    const h = new UTRLine();
    h.matchId =  'Match ID';
    h.date = 'Date';
    h.w1Name = 'Winner 1 Name';
    h.w1Id = 'Winner 1 Third Party ID';
    h.w1Gender = 'Winner 1 Gender';
    h.w1YOB = 'Winner 1 DOB';
    h.w1City = 'Winner 1 City';
    h.w1State = 'Winner 1 State';
    h.w1Country = 'Winner 1 Country';
    h.w1College = 'Winner 1 College';
    h.w2Name = 'Winner 2 Name';
    h.w2Id = 'Winner 2 Third Party ID';
    h.w2Gender = 'Winner 2 Gender';
    h.w2YOB = 'Winner 2 DOB';
    h.w2City = 'Winner 2 City';
    h.w2State = 'Winner 2 State';
    h.w2Country = 'Winner 2 Country';
    h.w2College = 'Winner 2 College';
    h.l1Name = 'Loser 1 Name';
    h.l1Id = 'Loser 1 Third Party ID';
    h.l1Gender = 'Loser 1 Gender';
    h.l1YOB = 'Loser 1 DOB';
    h.l1City = 'Loser 1 City';
    h.l1State = 'Loser 1 State';
    h.l1Country = 'Loser 1 Country';
    h.l1College = 'Loser 1 College';
    h.l2Name = 'Loser 2 Name';
    h.l2Id = 'Loser 2 Third Party ID';
    h.l2Gender = 'Loser 2 Gender';
    h.l2YOB = 'Loser 2 DOB';
    h.l2City = 'Loser 2 City';
    h.l2State = 'Loser 2 State';
    h.l2Country = 'Loser 2 Country';
    h.l2College = 'Loser 2 College';
    h.score = 'Score';
    h.idType = 'Id Type';
    h.drawName =  'Draw Name';
    h.drawGender = 'Draw Gender';
    h.drawTeamType = 'Draw Team Type';
    h.drawBracketType = 'Draw Bracket Type';
    h.drawBracketValue = 'Draw Bracket Value';
    h.drawType = 'Draw Type';
    h.tName = 'Tournament Name';
    h.tURL = 'Tournament URL';
    h.tStartDate = 'Tournament Start Date';
    h.tEndDate = 'Tournament End Date';
    h.tCity = 'Tournament City';
    h.tState = 'Tournament State';
    h.tCountry = 'Tournament Country';
    h.tCountryCode = 'Tournament Country Code';
    h.tHost = 'Tournament Host';
    h.tLocationType = 'Tournament Location Type';
    h.tSurface = 'Tournament Surface';
    h.tEventType = 'Tournament Event Type';
    h.tEventCategory = 'Tournament Event Category';
    h.tEventGrade = 'Tournament Event Grade';
    h.tImportSource = 'Tournament Import Source';
    h.tSanctionBody = 'Tournament Sanction Body';
    return h;
  }
}

export class UTRLine {
  matchId: string = null;
  date: string = null;
  w1Name: string = null;
  w1Id: string = null;
  w1Gender: string = null;
  w1YOB: string = null;
  w1City: string = null;
  w1State: string = null;
  w1Country: string = 'CAN';
  w1College: string = null;
  w2Name: string = null;
  w2Id: string = null;
  w2Gender: string = null;
  w2YOB: string = null;
  w2City: string = null;
  w2State: string = null;
  w2Country: string = 'CAN';
  w2College: string = null;
  l1Name: string = null;
  l1Id: string = null;
  l1Gender: string = null;
  l1YOB: string = null;
  l1City: string = null;
  l1State: string = null;
  l1Country: string = 'CAN';
  l1College: string = null;
  l2Name: string = null;
  l2Id: string = null;
  l2Gender: string = null;
  l2YOB: string = null;
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

  async dataFill(t: Tournament, e: Event, m: Match, stats: JobStats): Promise<boolean> {
    // Not interested in byes
    // i.e. where there is less than two participants for singles or 4 for doubles
    if ((e.isSingles && m.matchPlayers.length !== 2) || (!e.isSingles && m.matchPlayers.length !== 4)) {
      stats.bump('byes');
      return false;
    }

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
    this.date = t.endDate;
    if (w1) {
      this.w1City = w1.player.city;
      this.w1Name = w1.player.lastName + ', ' + w1.player.firstName;
      this.w1Id = w1.playerId.toString();
      this.w1Gender = w1.player.gender;
      this.w1YOB = (w1.player.DOB) ? w1.player.DOB.substr(0, 4) : '';
      this.w1City = w1.player.city;
      this.w1State = w1.player.province;
    }
    if (w2) {
      this.w2City = w2.player.city;
      this.w2Name = w2.player.lastName + ', ' + w2.player.firstName;
      this.w2Id = w2.playerId.toString();
      this.w2Gender = w2.player.gender;
      this.w1YOB = (w2.player.DOB) ? w2.player.DOB.substr(0, 4) : '';
      this.w2City = w2.player.city;
      this.w2State = w2.player.province;
    }
    if (l1) {
      this.l1City = l1.player.city;
      this.l1Name = l1.player.lastName + ', ' + l1.player.firstName;
      this.l1Id = l1.playerId.toString();
      this.l1Gender = l1.player.gender;
      this.w1YOB = (l1.player.DOB) ? l1.player.DOB.substr(0, 4) : '';
      this.l1City = l1.player.city;
      this.l1State = l1.player.province;
    }
    if (l2) {
      this.l2City = l2.player.city;
      this.l2Name = l2.player.lastName + ', ' + l2.player.firstName;
      this.l2Id = l2.playerId.toString();
      this.l2Gender = l2.player.gender;
      this.w1YOB = (l2.player.DOB) ? l2.player.DOB.substr(0, 4) : '';
      this.l2City = l2.player.city;
      this.l2State = l2.player.province;
    }
    this.score = m.score;
    this.drawGender = e.genderId;
    this.drawTeamType = (e.isSingles) ? 'Singles' : 'Doubles';
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
    this.tName = t.name;
    this.tURL = TOURNAMENT_URL_PREFIX + t.tournamentCode;
    this.tStartDate = t.startDate;
    this.tEndDate = t.endDate;
    this.tCity = t.city;
    this.tState = t.license.province;
    this.tHost = t.license.licenseName;
    this.tEventType = t.level;
    this.tEventGrade = e.grade;
    this.tSanctionBody = t.license.province;
    return true;
  }

}
