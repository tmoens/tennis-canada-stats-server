import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {Event} from "../event/event.entity";
import {Match} from "../match/match.entity";

@Entity("Draw")
@Index("event",["event",])
export class Draw {

  @PrimaryGeneratedColumn()
  drawId:number;

  @ManyToOne(type=>Event, eventId=>eventId.draws,{
    nullable:false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: "eventId"})
  event:Event;

  @Column("int",{
    comment: "VRs code for this draw.  It is unique within the tournament only."
  })
  drawCode:number;

  @Column("varchar",{
    length:255
  })
  name: string;

  @Column("int",{
    comment: "VRs draw type code - see the api docs"
  })
  typeId:number;

  @Column("int",{
    comment: "This is not the number of players, but the number of positions in the draw."
  })
  drawSize:number;

  @Column("int",{
    nullable:true,
    comment: "If the draw ends at the semis, this would be 4. Used for qualification draws."
  })
  endSize:number;

  @Column("tinyint",{
    nullable:false,
    default: false,
    width:1,
    comment: "Indicator that this draw is a qualifier as opposed to a main draw."
  })
  isQualification:boolean;

  @OneToMany(type => Match, matches => matches.draw, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  matches: Match[];

  // Given an event object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiDraw: any) {
    this.drawCode = parseInt(apiDraw.Code);
    this.name = apiDraw.Name;
    this.typeId = parseInt(apiDraw.TypeID);
    this.drawSize = parseInt(apiDraw.Size);
    if (null != apiDraw.EndSize) {
      this.endSize = parseInt(apiDraw.EndSize);
    }
    this.isQualification = ("true" == apiDraw.Qualification);
  }
}
