import {Index, Entity, Column, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {CalendarEvent} from './calendar-event.entity';

@Entity('tournament')
@Index('tournamentCode', ['tournamentCode'])
@Index('startDate', ['startDate'])
@Index('endDate', ['endDate'])
@Index('name', ['name'])
@Index('level', ['level'])
export class CalendarTournament {

  @PrimaryGeneratedColumn()
  tournamentId: number;

  @Column('varchar', {
    nullable: false,
    length: 255,
    name: 'tournamentCode',
    comment: 'VR UUID for this tournament',
  })
  tournamentCode: string;

  @Column('varchar', {
    nullable: false,
    length: 255,
    name: 'name',
  })
  name: string;

  @Column('varchar', {
    nullable: true,
    length: 255,
    name: 'level',
    comment: '[National|Provincial|Regional|Community|Club|Recreational]',
  })
  level: string;

  @Column('int', {
    nullable: false,
    name: 'typeId',
    comment: 'Tournament - 0, League - 1',
  })
  typeId: number;

  @Column('datetime', {
    nullable: false,
    comment: 'The time the tournament was last updated in VR (uploaded by the TD)',
  })
  lastUpdated: Date;

  @Column('date', {
    nullable: false,
    name: 'startDate',
  })
  startDate: string;

  @Column('date', {
    nullable: false,
    name: 'endDate',
  })
  endDate: string;

  @Column('varchar', {
    nullable: false,
    length: 255,
  })
  licenseName: string;

  @Column('varchar', {
    nullable: true,
    length: 255,
  })
  city: string;

  @Column('varchar', {
    nullable: true,
    length: 255,
  })
  province: string;

  @OneToMany(type => CalendarEvent, events => events.tournament, { onDelete: 'CASCADE' })
  events: CalendarEvent[];
}
