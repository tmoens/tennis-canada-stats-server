import {Index, Entity, Column, OneToMany, PrimaryColumn, UpdateDateColumn, VersionColumn} from 'typeorm';
import {ExternalEvent} from '../external-event/external-event.entity';

@Entity('external_tournament')
@Index('endDate', ['endDate'])
@Index('name', ['name'])
export class ExternalTournament {

  @PrimaryColumn('varchar', {
    nullable: false,
    primary: true,
    length: 50,
    name: 'tournamentId',
    comment: 'The external identifier of this tournament allows for UUID.',
  })
  tournamentId: string;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'name',
  })
  name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'zone',
  })
  zone: string | null;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'hostNation',
  })
  hostNation: string | null;

  @Column('varchar', {
    nullable: true,
    length: 10,
    name: 'sanctioningBody',
    comment: 'Sanctioning body will necessarily be one from the event_rating table',
  })
  sanctioningBody: string | null;

  @Column('varchar', {
    nullable: true,
    length: 40,
    name: 'category',
    comment: 'Category body will necessarily be one from the event_rating table',
  })
  category: string | null;

  @Column('varchar', {
    nullable: true,
    length: 16,
    name: 'subCategory',
    comment: 'sub-category body will necessarily be one from the event_rating table',
  })
  subCategory: string | null;

  @Column('date', {
    nullable: true,
    name: 'startDate',
    comment: 'Not presently used by the system',

  })
  startDate: string | null;

  @Column('date', {
    nullable: false,
    name: 'endDate',
  })
  endDate: string;

  @Column('tinyint', {
    nullable: true,
    width: 1,
    default: '0',
    name: 'manuallyCreated',
    comment: 'The tournament may have been created programmatically or manually.',
  })
  manuallyCreated: boolean | null;

  @OneToMany(type => ExternalEvent, externalEvent => externalEvent.tournament, {
    onDelete: 'CASCADE' ,
    onUpdate: 'CASCADE' ,
  })
  externalEvents: ExternalEvent[];

  @UpdateDateColumn()
  updateDate: Date;
  @VersionColumn()
  version: number;
}