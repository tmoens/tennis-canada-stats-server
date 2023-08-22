import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany} from 'typeorm';
import {Event} from '../event/event.entity';
import {Draw} from '../draw/draw.entity';
import {MatchPlayer} from '../match_player/match_player.entity';

@Entity()
@Index('event', ['event'])
@Index('draw', ['draw'])
export class Match {

  @PrimaryGeneratedColumn()
  matchId: number;

  @ManyToOne(type => Event, eventId => eventId.matches, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'eventId'})
  event: Event;

  @ManyToOne(type => Draw, drawId => drawId.matches, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'drawId'})
  draw: Draw;

  @Column('int', {
    comment: 'VRs code for this match ',
  })
  vrMatchCode: number;

  @Column('int', {
    comment: 'The VR number of the draw (in the tournament) in which this match happened',
  })
  vrDrawCode: number;

  @Column('int', {
    comment: 'The VR number of the event (in the tournament) in which this match happened',
  })
  vrEventCode: number;

  @Column('int', {
    name: 'winnerCode',
    comment: 'as per VR data. 0: none, 1: team 1, 2: team2, 3: tie',
  })
  winnerCode: number;

  @Column('int', {
    name: 'scoreStatus',
    comment: '0: normal, 1: walkover, 2: retirement, 3:dq, 4: no match, 5: bye',
  })
  scoreStatus: number;

  @OneToMany(type => MatchPlayer, matchPlayers => matchPlayers.match, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  matchPlayers: MatchPlayer[];

  @Column('varchar', {
    length: 255,
  })
  score: string;

  @Column('date', {
    nullable: true,
    name: 'date',
  })
  date: string;


  // Given a match object from the VR API, fill in our own fields

  // 2019-06-24 For tournaments and matches that have not yet been played,
  // the vr API still sends a match record - with a score status of 0 (Normal)!!!
  // If one of the players is missing, it could be a Bye, or it could simply
  // mean that the other player is TBD.  If BOTH players are missing, it
  // could mean that both players are TBD (e.g. a SF when the QF has not
  // yet been played.
  // As time goes by and the tournament is updated, these results will
  // be updated.
  // Problem is that we are getting match records in the db for matches that
  // are yet to be played, and we do not really want these, especially since
  // they are showing up with a "NULL" score.  So, new code is added.
  buildFromVRAPIObj(apiMatch: any) {
    this.vrMatchCode = parseInt(apiMatch.Code, 10);
    this.winnerCode = parseInt(apiMatch.Winner, 10);
    if (apiMatch.MatchTime) {
      this.date = apiMatch.MatchTime.substring(0, 10);
    }
    this.scoreStatus = parseInt(apiMatch.ScoreStatus, 10);

    switch (this.scoreStatus) {
      case 0: // Normal
        if (null == apiMatch.Sets) {
          // the VR API does not report a score - so figure out what is happening
          if (null == apiMatch.Team1.Player1 && null == apiMatch.Team2.Player1) {
            // neither player side is identified so the players are probably TBD
            // report the score as null
            this.score = null;
          } else if (apiMatch.Team1.Player1 && apiMatch.Team2.Player1) {
            // both players are identified so the match has not been played yet
            // report the score as null
            this.score = null;
          } else {
            // exactly one of the players has been identified, so it may be
            // a) a Bye
            // b) a match where the second player is TBD
            // Since we cannot distinguish between the two - report it as a bye.
            this.score = 'Bye';
          }
        } else {
          // the VR API *does* report a score, so convert it to a string
          this.score = this.makeScoreString(apiMatch);
        }
        break;
      case 1:
        this.score = 'Walkover';
        break;
      case 2:
        if (null == apiMatch.Sets) {
          this.score = 'Retirement';
        } else {
          this.score = this.makeScoreString(apiMatch) + ', Retirement';
        }
        break;
      case 3:
        this.score = 'Disqualification';
        break;
      case 4:
        this.score = 'Unknown';
        break;
      case 8:
        this.score = 'Defaulted';
        break;
      case 9:
        this.score = 'Not Played';
        break;
      default:
        this.score = 'Score Status: ' + this.scoreStatus;
    }
  }

  // make a score string from the returned XML
  makeScoreString(apiMatch: any): string {
    // The sets will come back as an array only if there are two or more
    // so we need to fix that up a bit.
    let sets: any[];
    if (Array.isArray(apiMatch.Sets.Set)) {
      sets = apiMatch.Sets.Set;
    } else {
      sets = [apiMatch.Sets.Set];
    }
    const score = []; // one element for each set to be joined later.
    for (const setScoreData of sets) {
      if (apiMatch.Winner === 2) {
        score.push(setScoreData.Team2 + '-' + setScoreData.Team1);
      } else {
        score.push(setScoreData.Team1 + '-' + setScoreData.Team2);
      }
    }
    return score.join(', ');
  }
  // Score lines are strings look like "6-7, 7-6, 10-3", but it gets pretty whacky sometimes.
  getMatchCompetitiveness(): number | string {

    // Break the score up in to the chunks that are separated by ", " (i.e. the set scores)
    const sets: string[] = this.score.split(', ');

    // If there are no sets (i.e. the score string was empty)
    if (sets.length === 0) return `scoreStringHadNoSets(ShouldNotHappen)`;

    // isolate the scores of each side
    const side1Scores: number[] = [];
    const side2Scores: number[] = [];

    for (const set of sets) {
      // split the set into two numbers
      const sideScores: string[] = set.split('-');

      // it's a wonky score if there are not exactly two side scores in every set
      if (sideScores.length !== 2) return `wonkySetScore ${this.score} (Should Not Happen)`;

      // it's a wonky score if either side's score is not a number
      const s1score = Number(sideScores[0]);
      const s2score = Number(sideScores[1]);
      if (Number.isNaN(s1score) || Number.isNaN(s2score)) {
        return `wonkySetScore ${this.score} (Should Not Happen)`;
      }

      // looks like it is a good set score
      side1Scores.push(s1score);
      side2Scores.push(s2score);
    }

    // Identify a superbreaker in the last set of a 3 set match
    if (side1Scores.length === 3) {
      // find the maximum score in the first two sets
      const setOneAndTwoMax: number = Math.max(side1Scores[0], side1Scores[1], side2Scores[0], side2Scores[1]);

      // find the max score in thte third set
      const setThreeMax: number = Math.max(side1Scores[2], side2Scores[2]);

      // If the thrid set max is more than two greater than the first two sets max,
      // I figure this is a super breaker.  In that case, the first two sets are measured
      // in games but the third is measured in points.  So we normalize the third set to
      // games by dividing the points by 5. (why not?)
      if ((setThreeMax - 1) > setOneAndTwoMax) {
        side1Scores[2] = side1Scores[2] / 5;
        side2Scores[2] = side2Scores[2] / 5;
      }
    }

    let side1Total: number = 0;
    let side2Total: number = 0;

    side1Scores.map((score: number) => side1Total += score);
    side2Scores.map((score: number) => side2Total += score);

    // Being a little careful
    if (side1Total === 0 && side2Total === 0) return null;

    if (side1Total >= side2Total ) {
      return side2Total/side1Total;
    } else {
      return side1Total/side2Total;
    }
  }
}
