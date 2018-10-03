import {Index, Entity, Column, OneToMany, UpdateDateColumn, ManyToOne, JoinColumn} from "typeorm";
import {Event} from "../event/event.entity";
import {License} from "../license/license.entity";

@Entity("Tournament")
@Index("tournamentCode",["tournamentCode",])
@Index("startDate",["startDate",])
@Index("endDate",["endDate",])
@Index("name",["name",])
@Index("level",["level",])
export class Tournament {

  @Column("varchar",{
    nullable:false,
    primary:true,
    length:255,
    name:"tournamentCode",
    comment: "VR UUID for this tournament"
  })
  tournamentCode:string;

  @Column("varchar",{
    nullable:false,
    length:255,
    name:"name"
  })
  name:string;

  @Column("varchar",{
    nullable:true,
    length:255,
    name:"level",
    comment: "[National|Provincial|Regional|Community|Club|Recreational]"
  })
  level:string;

  @Column("int",{
    nullable:false,
    name:"typeId",
    comment: "Tournament - 0, League - 1"
  })
  typeId:number;

  @Column("datetime",{
    nullable:false,
    name:"lastUpdatedInVR",
    comment: "The time the tournament was last updated in VR (uploaded by the TD)"
  })
  lastUpdatedInVR:Date;

  @Column("date",{
    nullable:false,
    name:"startDate"
  })
  startDate:string;

  @Column("date",{
    nullable:false,
    name:"endDate"
  })
  endDate:string;

  // @Column("varchar",{
  //   length:255,
  //   name:"licenseName",
  //   comment: "The name of the VR licensee for the tournament."
  // })
  // licenseName:string;
  @ManyToOne(type => License, license => license.tournaments, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: "licenseName"})
  license: License;

  @Column("varchar",{
    nullable:true,
    length:255,
    name:"city"
  })
  city:string;

  @OneToMany(type=>Event, events=>events.tournament,{ onDelete: 'CASCADE' })
  events:Event[];

  // Check if our view of when the tournamentId was last updated in VR
  // is older than the provided date string - in which case we are out of date.
  isOutOfDate(lastUpdateInVR:string): boolean {
    // We have to truncate milliseconds from the incoming "LastUpdated" time
    // Because mysql does the same when it stores the value and we need to
    // compare the two so we know if ours is out of date.
    let lu:Date = new Date(lastUpdateInVR);
    lu.setMilliseconds(0);
    return (null == this.lastUpdatedInVR || this.lastUpdatedInVR < lu);
  }

  @UpdateDateColumn()
  tcUpdatedAt: Date;



  // Given an tournamentId object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiTournament:any) {
    this.tournamentCode = apiTournament.Code;
    this.name = apiTournament.Name;
    this.typeId = parseInt(apiTournament.TypeID);
    this.lastUpdatedInVR = new Date(apiTournament.LastUpdated);
    this.startDate = apiTournament.StartDate.substring(0, 10);
    this.endDate = apiTournament.EndDate.substring(0, 10);
    if (null != apiTournament.Category) this.level = apiTournament.Category.Name;
    this.city = apiTournament.Venue.City;
    this.events = [];
  }
}