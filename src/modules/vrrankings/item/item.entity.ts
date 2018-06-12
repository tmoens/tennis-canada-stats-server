import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn} from "typeorm";
import {Player} from "../../player/player.entity";
import {VRRankingsCategory} from "../category/category.entity";
import {VRRankingsPublication} from "../publication/publication.entity";

@Entity("VRRankingsItem")
@Index("category",["category",])
@Index("publication",["publication",])
@Index("player",["player",])
export class VRRankingsItem {

  // Normally, the category+publication+player is unique and
  // would be the primary key.  But there is a corner case
  // where a player gets two Ids and shows up in a rankings list
  // under both Ids.  Then when the Ids are merged, we would end
  // up with the same player twice in the same ranking list.
  // So we created a generated key.
  @PrimaryGeneratedColumn()
  vrRankingsItemId;

  @ManyToOne(type => VRRankingsCategory, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: 'categoryCode'})
  category: VRRankingsCategory;

  @ManyToOne(type => VRRankingsPublication, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: 'publicationCode'})
  publication: VRRankingsPublication;

  @ManyToOne(type => Player, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: "playerId"})
  player: Player;

  // This "column" just give access to the player Id value
  // without having to load the entire player object.
  @Column()
  playerId:number;

  @Column("int")
  rank: number;

  @Column("float")
  points: number;

}
