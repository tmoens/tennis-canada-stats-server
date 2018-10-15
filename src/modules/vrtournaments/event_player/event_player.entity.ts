import {Entity, Column, ManyToOne, JoinColumn, Index, PrimaryColumn, PrimaryGeneratedColumn} from 'typeorm';
import {Player} from '../../player/player.entity';
import {Event} from '../event/event.entity';

@Entity('EventPlayer')
@Index(['event', 'player'], { unique: true })

export class EventPlayer {
  @PrimaryGeneratedColumn()
  eventPlayerId: number;

  @ManyToOne(type => Event, eventId => eventId.players, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'eventId'})
  event: Event;

  @ManyToOne(type => Player, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'playerId'})
  player: Player;

  // This "column" just give access to the player Id value
  // without having to load the entire player object.
  @Column()
  playerId: number;

  // This "column" just give access to the event Id value
  // without having to load the entire player object.
  @Column()
  eventId: number;

  constructor(event: Event, player: Player) {
    this.event = event;
    this.player = player;
  }
}
