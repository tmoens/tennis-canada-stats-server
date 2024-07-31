import {Index, Entity, Column, OneToMany, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import {Tournament} from '../tournament/tournament.entity';
import {Draw} from '../draw/draw.entity';
import {Match} from '../match/match.entity';
import {EventPlayer} from '../event_player/event_player.entity';
import {VRRankingsCategory} from '../../vrrankings/category/category.entity';

@Entity()
@Index('tournament', ['tournament'])

export class Event {

  @PrimaryGeneratedColumn()
  eventId: number;

  @ManyToOne(type => Tournament, tournament => tournament.events, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({name: 'tournamentCode'})
  tournament: Tournament;

  @ManyToOne(type => VRRankingsCategory, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'vrCategoryCode'})
  vrRankingsCategory: VRRankingsCategory;

  @Column('int', {
    nullable: false,
    name: 'eventCode',
    comment: 'VRs code for this Event. It is unique within the tournament only.',
  })
  eventCode: number;

  @Column('varchar', {
    nullable: false,
    length: 100,
    name: 'name',
  })
  name: string;

  @Column('int', {
    nullable: true,
    comment: 'For Adult events: VR Levels: 1 through 7',
  })
  level: number;

  @Column('tinyint', {
    nullable: false,
    width: 1,
    default: '0',
  })
  isSingles: boolean;

  @Column('int', {
    comment: 'For junior events',
  })
  minAge: number;

  @Column('int', {
    comment: 'For senior events',
  })
  maxAge: number;

  @Column('varchar', {
    length: 2,
    name: 'genderId',
  })
  genderId: string;

  @Column('int', {
    comment: 'Ranking points awarded to the winner',
  })
  winnerPoints: number;

  @Column('int', {
    nullable: true,
  })
  numberOfEntries: number;

  @Column('varchar', {
    nullable: true,
    length: 255,
  })
  grade: string;

  @OneToMany(type => Draw, draws => draws.event, {onDelete: 'CASCADE'})
  draws: Draw[];

  @OneToMany(type => Match, matches => matches.event, {onDelete: 'CASCADE'})
  matches: Match[];

  @OneToMany(type => EventPlayer, eventPlayers => eventPlayers.event, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  players: EventPlayer[];

  // Given an event object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiEvent: any) {
    this.eventCode = parseInt(apiEvent.Code, 10);
    this.name = apiEvent.Name;
    switch (parseInt(apiEvent.GenderID, 10)) {
      case 1:
      case 4:
        this.genderId = 'M';
        break;
      case 2:
      case 5:
        this.genderId = 'F';
        break;
      default:
        this.genderId = 'X';
    }
    if (null != apiEvent.LevelID) this.level = parseInt(apiEvent.LevelID, 10);
    this.maxAge = (null != apiEvent.MaxAge) ? this.maxAge = parseInt(apiEvent.MaxAge, 10) : 0;
    this.minAge = (null != apiEvent.MinAge) ? this.minAge = parseInt(apiEvent.MinAge, 10) : 0;
    this.winnerPoints = (null != apiEvent.Points1) ?
      this.winnerPoints = parseInt(apiEvent.Points1, 10) : 0;
    this.isSingles = (1 === parseInt(apiEvent.GameTypeID, 10));
    if (null != apiEvent.Grading) this.grade = apiEvent.Grading.Name;
  }

  buildCategoryId(): string {
    // Singles or doubles?
    const sd = this.isSingles ? 'S' : 'D';

    // Figure out what type of event it is
    if (this.minAge > 28) {
      // looks like a senior's event
      return ('S' + this.genderId + sd + 'O' + this.minAge);
    }
    if (this.maxAge < 19  && this.maxAge > 1) {
      // looks like a junior event
      return ('J' + this.genderId + sd + 'U' + this.maxAge);
    }

    // we are assuming a level based (Adult) event,
    // and we are assuming that the Level is therefore filled in.
    return ('A' + this.genderId + sd + 'L' + this.level);
  }
}
