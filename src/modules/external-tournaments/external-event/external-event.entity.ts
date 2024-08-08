import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { ExternalTournament } from '../external-tournament/external-tournament.entity';
import { ExternalEventResult } from '../external-event-result/external-event-result.entity';
import { ItfMatchResult } from '../itf-match-results/itf-match-result.entity';

@Entity('external_event')
export class ExternalEvent {
  @PrimaryColumn('varchar', {
    nullable: false,
    length: 36,
    name: 'eventId',
    comment:
      'identifier for the event from the external system. Allows for UUID.',
  })
  eventId: string;

  @ManyToOne(
    () => ExternalTournament,
    (externalTournament) => externalTournament.externalEvents,
    {
      nullable: false,
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'tournamentId' })
  tournament: ExternalTournament;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'name',
  })
  name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 7,
    name: 'gender',
  })
  gender: string | null;

  @Column('varchar', {
    nullable: true,
    length: 10,
    name: 'eventType',
  })
  eventType: string | null;

  @Column('varchar', {
    nullable: true,
    length: 7,
    name: 'discipline',
    comment: 'singles or doubles',
  })
  discipline: string | null;

  @Column('int', {
    nullable: false,
    name: 'drawSize',
    comment:
      'Used to figure out if the player lost in the first round, in turn used for ranking point allocation corner cases.',
  })
  drawSize: number;

  @Column('tinyint', {
    nullable: true,
    width: 1,
    default: '0',
    name: 'ignoreResults',
    comment:
      'The results for this event are not used in TC Rankings. Mostly for ITF qualies.',
  })
  ignoreResults: boolean | null;

  @Column('tinyint', {
    nullable: true,
    width: 1,
    default: '0',
    name: 'manuallyCreated',
    comment: 'The event may have been created programmatically or manually.',
  })
  manuallyCreated: boolean | null;

  @OneToMany(() => ExternalEventResult, (eventResults) => eventResults.event, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  eventResults: ExternalEventResult[];

  @OneToMany(() => ItfMatchResult, (matches) => matches.event, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  matches: ItfMatchResult[];

  @UpdateDateColumn()
  updateDate: Date;
  @VersionColumn()
  version: number;
}
