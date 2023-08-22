import {Tournament} from '../../../vrtournaments/tournament/tournament.entity';
import {Event} from '../../../vrtournaments/event/event.entity';
import {Match} from '../../../vrtournaments/match/match.entity';
import {JobStats} from '../../../../utils/jobstats';
import {Logger} from 'log4js';
import {MatchPlayer} from '../../../vrtournaments/match_player/match_player.entity';
import * as moment from 'moment/moment';
import {TOURNAMENT_URL_PREFIX} from '../match-data-exporter.service';

// A line in the UTR Report

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
