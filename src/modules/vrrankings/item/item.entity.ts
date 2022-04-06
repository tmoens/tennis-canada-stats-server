import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn} from 'typeorm';
import {Player} from '../../player/player.entity';
import {VRRankingsPublication} from '../publication/publication.entity';

@Entity('vrrankingsitem')
@Index('publication', ['publication'])
@Index('player', ['player'])
export class VRRankingsItem {

  // Normally, the publication+player is unique and
  // would be the primary key.  But there is a corner case
  // where a player gets two Ids and shows up in a rankings list
  // under both Ids.  Then when the Ids are merged, we would end
  // up with the same player twice in the same ranking list.
  // So we created a generated key.
  @PrimaryGeneratedColumn()
  vrRankingsItemId;

  @ManyToOne(type => VRRankingsPublication, publication => publication.items, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({name: 'publicationId'})
  publication: VRRankingsPublication;

  @ManyToOne(type => Player, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({name: 'playerId'})
  player: Player;

  // This "column" just give access to the player Id value
  // without having to load the entire player object.
  @Column()
  playerId: number;

  // This "column" just give access to the publication Id value
  // without having to load the entire player object.
  @Column()
  publicationId: number;

  @Column('int')
  rank: number;

  @Column('float')
  points: number;

}
