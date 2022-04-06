import {Index, Entity, Column, PrimaryColumn, JoinColumn, ManyToOne} from 'typeorm';

@Entity()
@Index('firstName', ['firstName'])
@Index('lastName', ['lastName'])
@Index('DOB', ['DOB'])
@Index('renumberedToPlayer', ['renumberedToPlayer'])
@Index('itfOptIn', ['itfOptIn'])
export class Player {

  @PrimaryColumn()
  playerId: number;

  @Column('varchar', {
    length: 50,
  })
  firstName: string;

  @Column('varchar', {
    length: 50,
  })
  lastName: string;

  @Column('varchar', {
    nullable: true,
    length: 2,
  })
  gender: string;

  @Column('date', {
    nullable: true,
  })
  DOB: string;

  @Column('varchar', {
    nullable: true,
    length: 20,
  })
  province: string;

  @Column('varchar', {
    nullable: true,
    length: 50,
  })
  city: string;

  @Column('varchar', {
    nullable: true,
    length: 10,
  })
  postalCode: string;

  @Column('varchar', {
    nullable: true,
    length: 100,
  })
  email: string;

  @Column('varchar', {
    nullable: true,
    length: 20,
  })
  phone: string;

  @Column('varchar', {
    nullable: true,
    length: 20,
  })
  phone2: string;

  @Column('varchar', {
    nullable: true,
    length: 20,
  })
  mobile: string;

  @Column('varchar', {
    nullable: true,
    length: 250,
  })
  address: string;

  @Column('varchar', {
    nullable: true,
    length: 255,
    comment: 'How this player was discovered/updated.',
  })
  source: string;

  @Column('boolean', {
    nullable: true,
    default: null,
    comment: 'If the player want to have an ITF Rating',
  })
  itfOptIn: boolean;

  @ManyToOne(type => Player, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'renumberedToPlayerId'})
  renumberedToPlayer: Player;

// This "column" just give access to the renumberedToPlayerId value
// without having to load the entire player object.
  @Column({ nullable: true })
  renumberedToPlayerId: number;

// Given an player object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiObj: any) {
    this.playerId = apiObj.MemberID;
    this.firstName = apiObj.Firstname;
    this.lastName = apiObj.Lastname;
    if (apiObj.DateOfBirth) {
      this.DOB = apiObj.DateOfBirth.substring(0, 10);
    }
    if (apiObj.GenderID === 1) this.gender = 'M';
    if (apiObj.GenderID === 2) this.gender = 'F';
  }
}
