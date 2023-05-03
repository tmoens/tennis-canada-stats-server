import {Tournament} from '../../../vrtournaments/tournament/tournament.entity';
import {Match} from '../../../vrtournaments/match/match.entity';
import {Event} from '../../../vrtournaments/event/event.entity';
import {MatchPlayer} from '../../../vrtournaments/match_player/match_player.entity';

export class MatchQualityLine {
  matchId?: string;
  tournamentId: string = null;
  tournamentLevel?: string;
  tournamentType: string = null;
  province?: string;
  city?: string;
  score: string = null;
  competitiveness?: number;

  side1Player1Id: string;
  side1Player2Id?: string;
  side2Player1Id: string;
  side2Player2Id?: string;

  matchWinner: string = null;
  license: string = null;
  vrEventId?: number;
  eventGrade?: string;
  eventGender?: string = null;
  eventMinAge?: number;
  eventMaxAge?: number;
  eventIsSingles: boolean; // Singles or doubles
  eventSize?: number;
  date?: string;

  constructor() {
  }

  dataFill(t: Tournament, e: Event, m: Match): boolean {
    this.matchId = [t.tournamentCode, m.vrEventCode, m.vrDrawCode, m.vrMatchCode].join('-');

    this.tournamentId = t.tournamentCode;
    this.tournamentLevel = t.level;
    this.tournamentType = t.getType();
    if (t.city) this.city = t.city;
    if (t.license) {
      this.license = t.license.licenseName;
      if (t.license.province) {
        this.province = t.license.province
      }
    }

    if (e.eventCode) this.vrEventId = e.eventCode;
    if (e.grade) this.eventGrade = e.grade;
    if (e.genderId) this.eventGender = e.genderId;
    if (e.maxAge  && e.maxAge > 0 ) this.eventMaxAge = e.maxAge;
    if (e.minAge  && e.minAge > 0 ) this.eventMinAge = e.minAge;

    this.eventIsSingles = e.isSingles; // Singles or doubles
    if (e.numberOfEntries && e.numberOfEntries > 0) this.eventSize = e.numberOfEntries;

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

    this.matchId = [t.tournamentCode, m.vrEventCode, m.vrDrawCode, m.vrMatchCode].join('-');
    this.side1Player1Id = p11.playerId.toString();
    this.side2Player1Id = p21.playerId.toString();
    if (!e.isSingles) {
      this.side1Player2Id = p12.playerId.toString();
      this.side2Player2Id = p22.playerId.toString();
    }
    this.matchWinner = String(m.winnerCode);

    this.score = m.score; // side 1 perspective
    this.competitiveness = m.getMatchCompetitiveness();

    console.log(JSON.stringify(this, null, 2));
    return true;
  }
}
