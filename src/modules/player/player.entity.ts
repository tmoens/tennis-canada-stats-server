import {Index, Entity, Column, PrimaryColumn, JoinColumn, ManyToOne} from "typeorm";

@Entity("Player")
@Index("firstName",["firstName",])
@Index("lastName",["lastName",])
@Index("DOB",["DOB",])
export class Player {

  @PrimaryColumn()
  playerId:number;

  @Column("varchar",{
    length:50
  })
  firstName:string;

  @Column("varchar",{
    length:50
  })
  lastName:string;

  @Column("varchar",{
    nullable:true,
    length:2
  })
  gender:string;

  @Column("date",{
    nullable:true
  })
  DOB:string;

  @Column("varchar",{
    nullable:true,
    length:3
  })
  province:string;

  @Column("varchar",{
    nullable:true,
    length:50
  })
  city:string;

  @Column("varchar",{
    nullable:true,
    length:10
  })
  postalCode:string;

  @Column("varchar",{
    nullable:true,
    length:100
  })
  email:string;

  @Column("varchar",{
    nullable:true,
    length:10
  })
  phone:string;

  @Column("varchar",{
    nullable:true,
    length:10
  })
  phone2:string;

  @Column("varchar",{
    nullable:true,
    length:10
  })
  mobile:string;

  @Column("varchar",{
    nullable:true,
    length:50
  })
  address:string;

  @Column("varchar",{
    nullable:true,
    length:255,
    comment: "How this player was discovered/updated."
  })
  source:string;

  @ManyToOne(type=>Player,{
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name:'renumberedToPlayerId'})
  renumberedToPlayer:Player;

  // This "column" just give access to the renumberdToPlayerId value
  // without having to load the entire player object.
  @Column({ nullable: true })
  renumberedToPlayerId:number;

  // Given an player object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiObj:any) {
    this.playerId = apiObj.MemberID;
    this.firstName = apiObj.Firstname;
    this.lastName = apiObj.Lastname;
    this.DOB = apiObj.DateOfBirth.substring(0,10);
  }
}
