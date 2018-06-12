import {Index,Entity, PrimaryGeneratedColumn, Column, CreateDateColumn} from "typeorm";
import {License} from "../../vrtournaments/license/license.entity";
import {VRRankingsType} from "../type/type.entity";

@Entity("VRRankingsPublication")
@Index("publicationCode",["publicationCode",])
export class VRRankingsPublication {

  @Column("varchar",{
    length:40,
    primary:true,
    comment: "The unique code for this publication."
  })
  publicationCode:string;

  @Column("varchar",{
    length:255,
    comment:"The VR code for the rankings group (Adult/Junior/Senior/Wheelchair)."
  })
  typeCode:string;

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
  buildFromVRAPIObj(rankingType: VRRankingsType, apiPublication:any) {
    this.publicationCode = apiPublication.Code;
    this.year = parseInt(apiPublication.Year);
    this.week = parseInt(apiPublication.Week);
    this.publicationDate = new Date(apiPublication.PublicationDate);
    this.typeCode = rankingType.typeCode;
  }
}
