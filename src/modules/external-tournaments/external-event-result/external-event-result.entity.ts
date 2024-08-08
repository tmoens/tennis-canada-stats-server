import {
  Index,
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  VersionColumn,
} from 'typeorm';
import { ExternalEvent } from '../external-event/external-event.entity';
import { ExternalPlayer } from '../external-player/external-player.entity';

@Entity('external_event_result')
@Index('fi__player_key', ['player'])
export class ExternalEventResult {
  @Column({
    nullable: false,
    primary: true,
  })
  playerId: string;

  @Column({
    nullable: false,
    primary: true,
  })
  eventId: string;

  @ManyToOne(() => ExternalEvent, (event) => event.eventResults, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId' })
  event: ExternalEvent;

  @ManyToOne(() => ExternalPlayer, (player) => player.eventResults, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'playerId' })
  player: ExternalPlayer;

  @Column('int', {
    nullable: true,
    name: 'finishPosition',
  })
  finishPosition: number | null;

  @Column('int', {
    nullable: true,
    name: 'externalRankingPoints',
  })
  externalRankingPoints: number | null;

  @Column('int', {
    nullable: true,
    name: 'manualPointAllocation',
  })
  manualPointAllocation?: number | null;

  @VersionColumn()
  version: number;
}
