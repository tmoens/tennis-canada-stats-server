import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn } from 'typeorm';
import {CalendarTournament} from './calendar-tournament.entity';

@Entity('event')
@Index('tournament', ['tournament'])

export class CalendarEvent {

  @PrimaryGeneratedColumn()
  eventId: number;

  @ManyToOne(type => CalendarTournament, tournament => tournament.events, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({name: 'tournamentId'})
  tournament: CalendarTournament;

  @Column('int', {
    nullable: false,
    name: 'eventCode',
    comment: 'VRs code for this Event. It is unique within the tournament only.',
  })
  eventCode: number;

  @Column('varchar', {
    nullable: false,
    length: 255,
    comment: '[A|J|S][S|D][M|F][L1|L2|...|L7|O30|O35|...|O85|U12|U14|U16|U18]',
  })
  categoryId: string;

  @Column('varchar', {
    nullable: false,
    length: 255,
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
    length: 255,
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
  rosterSize: number;

  @Column('varchar', {
    nullable: true,
    length: 255,
  })
  grade: string;


}
