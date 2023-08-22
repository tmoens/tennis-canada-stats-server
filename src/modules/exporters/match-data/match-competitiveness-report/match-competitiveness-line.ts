import {Tournament} from '../../../vrtournaments/tournament/tournament.entity';
import {Match} from '../../../vrtournaments/match/match.entity';
import {Event} from '../../../vrtournaments/event/event.entity';

export class MatchCompetitivenessLine {
  matchId?: string;
  tournamentName: string;
  tournamentId: string = null;
  tournamentLevel?: string;
  tournamentType: string = null;
  province?: string;
  city?: string;
  score: string = null;
  competitiveness?: number;

  winner1: string;
  winner2?: string;
  loser1: string;
  loser2?: string;

  license: string = null;
  vrEventId?: number;
  eventName?: string;
  eventGrade?: string;
  eventGender?: string = null;
  eventMinAge?: number;
  eventMaxAge?: number;
  eventIsSingles: boolean; // Singles or doubles
  eventSize?: number;
  date: string;

  constructor() {
  }

  dataFill(t: Tournament, e: Event, m: Match): string {
    // cannot create a record for matches with no winner code or no score or no date
    // Winner Codes 0: none (often just unplayed matches), 1: side 1, 2: side 2, 3: tie
    if (m.winnerCode < 1) return 'noWinnerCode(Unplayed)';

    // Score status other than 0 implies retirements, walkovers and defaults, so
    // we ignore those as we cant sy the match was competitive or not.
    if (m.scoreStatus !== 0) return `scoreStatus: ${m.scoreStatus}`;

    // If the score string is empty or undefined we can't say the match was competitive.
    if (!m.score || !m.score.trim()) return 'noScoreLine';

    if (m.score === 'Bye') return 'scorelineIsBye';

    if (!m.date) return `${t.tournamentCode} Type:${t.typeId} Draw: ${m.vrDrawCode} MissingMatchDateCount`;

    this.date = m.date;

    this.matchId = [t.tournamentCode, m.vrEventCode, m.vrDrawCode, m.vrMatchCode].join('-');

    for (const mp of m.matchPlayers) {
      if (1 === mp.team && 1 === mp.position) {
        if (m.winnerCode === 1) {
          this.winner1 = mp.playerId.toString(10);
        } else {
          this.loser1 = mp.playerId.toString(10);
        }
      }
      if (1 === mp.team && 2 === mp.position) {
        if (m.winnerCode === 1) {
          this.winner2 = mp.playerId.toString(10);
        } else {
          this.loser2 = mp.playerId.toString(10);
        }
      }
      if (2 === mp.team && 1 === mp.position) {
        if (m.winnerCode === 1) {
          this.loser1 = mp.playerId.toString(10);
        } else {
          this.winner1 = mp.playerId.toString(10);
        }
      }
      if (2 === mp.team && 2 === mp.position) {
        if (m.winnerCode === 1) {
          this.loser2 = mp.playerId.toString(10);
        } else {
          this.winner2 = mp.playerId.toString(10);
        }
      }
    }

    // If we have no winner or loser, we are not interested. (I.e. skip byes)
    if (!this.winner1 || !this.loser1) return 'inferredBye (Should Not Happen)';

    this.tournamentId = t.tournamentCode;
    this.tournamentName = t.name;
    this.tournamentLevel = t.level;
    this.tournamentType = t.getType();
    if (t.city) this.city = t.city;
    if (t.license) {
      this.license = t.license.licenseName;
      if (t.license.province) {
        this.province = t.license.province
      }
    }

    if (e.name) this.eventName = e.name;
    if (e.eventCode) this.vrEventId = e.eventCode;
    if (e.grade) this.eventGrade = e.grade;
    if (e.genderId) this.eventGender = e.genderId;
    if (e.maxAge  && e.maxAge > 0 ) this.eventMaxAge = e.maxAge;
    if (e.minAge  && e.minAge > 0 ) this.eventMinAge = e.minAge;

    this.eventIsSingles = e.isSingles; // Singles or doubles
    if (e.numberOfEntries && e.numberOfEntries > 0) this.eventSize = e.numberOfEntries;

    this.score = m.score; // side 1 perspective
    const matchCompetitiveness: string|number = m.getMatchCompetitiveness();
    if (typeof matchCompetitiveness === 'string') return matchCompetitiveness;

    if (typeof matchCompetitiveness === 'number') this.competitiveness = matchCompetitiveness;
    // console.log(JSON.stringify(this, null, 2));
    return '';
  }
}
