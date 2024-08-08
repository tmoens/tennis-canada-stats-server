/**
 * This table is for Canadian players with identities in other tennis systems like the ITF or ATP.
 */

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
} from 'typeorm';
import { Player } from '../../player/player.entity';
import { ExternalEventResult } from '../external-event-result/external-event-result.entity';
import { ItfMatchResult } from '../itf-match-results/itf-match-result.entity';

@Entity('external_player')
export class ExternalPlayer {
  @Column('char', {
    nullable: false,
    primary: true,
    length: 36,
    name: 'playerId',
    comment: 'The id of the player in the external system.',
  })
  playerId: string;

  @ManyToOne(() => Player, {
    nullable: true,
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'internalId' })
  tcPlayer: Player | null;

  // Expose the internal player Id without having to join the tables
  @Column()
  internalId: number;

  @Column('tinyint', {
    nullable: true,
    width: 1,
    default: '0',
    name: 'manuallyUpdated',
    comment: 'Note if this was entered manually (as opposed to automatically)',
  })
  manuallyUpdated: boolean | null;

  @Column('char', {
    nullable: true,
    length: 16,
    name: 'ipin',
    comment: 'IPIN is only for ITF players',
  })
  ipin: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'firstName',
  })
  firstName: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'lastName',
  })
  lastName: string | null;

  @Column('char', {
    nullable: true,
    length: 1,
    name: 'gender',
    comment: '',
  })
  gender: string | null;

  @Column('date', {
    nullable: false,
    name: 'DOB',
  })
  DOB: string;

  @Column('char', {
    nullable: true,
    length: 3,
    name: 'nationality',
  })
  nationality: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'residence',
  })
  residence: string | null;

  @Column('decimal', {
    nullable: true,
    precision: 3,
    scale: 2,
    name: 'height',
  })
  height: number | null;

  @Column('decimal', {
    nullable: true,
    precision: 5,
    scale: 2,
    name: 'weight',
  })
  weight: number | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'coach',
  })
  coach: string | null;

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
