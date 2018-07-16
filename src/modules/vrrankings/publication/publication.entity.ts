import {Index, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ManyToOne} from "typeorm";
import {VRRankingsCategory} from "../category/category.entity";

/**
 * NOTE
 * To VR, a publication is per type of ranking (adult/junior/senior/wheelchair)
 * We create a separate publication object for each category within the type of ranking.
 * This makes the retrieval of a particular ranking list
 * (e.g. 2015 week 2 under 16 girls doubles) much more efficient.
 *
 */

@Entity("VRRankingsPublication")
@Index("publicationCode",["publicationCode",])
export class VRRankingsPublication {

  @PrimaryGeneratedColumn()
  publicationId:number;

  @Column("varchar",{
    length:255,
    comment: "The code for the VR publication. Shared by all the categories in a specific VR publication."
  })
  publicationCode:string;

  @ManyToOne(type => VRRankingsCategory, rankingsCategory => rankingsCategory.publications, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: "categoryCode"})
  rankingsCategory: VRRankingsCategory;

  @Column()
  year:number;

  @Column()
  week:number;

  @Column("datetime",{
    nullable:false,
    comment:"publication date of the ranking."
  })
  publicationDate:Date;

  @CreateDateColumn()
  tcCreatedAt:Date;

  // Check if our view of when the publication was published in VR
  // is older than the provided date string - in which case we are out of date.
  isOutOfDate(lastUpdateInVR:string): boolean {
    // We have to truncate milliseconds from the incoming "LastUpdated" time
    // Because mysql does the same when it stores the value and we need to
    // compare the two so we know if ours is out of date.
    let lu:Date = new Date(lastUpdateInVR);
    lu.setMilliseconds(0);
    return (null == this.publicationDate || this.publicationDate < lu);
  }

  // Given a publication object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiPublication:any) {
    this.publicationCode = apiPublication.Code;
    this.year = parseInt(apiPublication.Year);
    this.week = parseInt(apiPublication.Week);
    this.publicationDate = new Date(apiPublication.PublicationDate);
  }
}
