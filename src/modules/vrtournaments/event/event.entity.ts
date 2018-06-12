import {Index, Entity, Column, OneToMany, ManyToOne, JoinColumn, JoinTable, PrimaryGeneratedColumn, ManyToMany} from "typeorm";
import {Tournament} from "../tournament/tournament.entity";
import {Draw} from "../draw/draw.entity";
import {Match} from "../match/match.entity";
import {Player} from "../../player/player.entity";

// TODO possibly renaming Event to something else because "Event" means something else too

@Entity("Event")
@Index("tournament",["tournament",])
@Index("categoryId",["categoryId",])
export class Event {

  @PrimaryGeneratedColumn()
  eventId: number;

  @ManyToOne(type => Tournament, tournament => tournament.events, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({name: "tournamentCode"})
  tournament: Tournament;

  @Column("int", {
    nullable: false,
    name: "eventCode",
    comment: "VRs code for this Event. It is unique within the tournament only."
  })
  eventCode: number;

  @Column("varchar", {
    nullable: false,
    length: 10,
    comment: "[A|J|S][S|D][M|F][L1|L2|...|L7|O30|O35|...|O85|U12|U14|U16|U18]"
  })
  categoryId: string;

  @Column("varchar", {
    nullable: false,
    length: 100,
    name: "name"
  })
  name: string;

  @Column("int", {
    nullable: true,
    comment: "For Adult events: VR Levels: 1 through 7"
  })
  level: number;

  @Column("tinyint", {
    nullable: false,
    width: 1,
    default: "0"
  })
  isSingles: boolean;


  @Column("int", {
    comment: "For junior events"
  })
  minAge: number;


  @Column("int", {
    comment: "For senior events"
  })
  maxAge: number;


  @Column("varchar", {
    length: 2,
    name: "genderId"
  })
  genderId: string;


  @Column("int", {
    comment: "Ranking points awarded to the winner"
  })
  winnerPoints: number;

  @Column("int", {
    nullable: true
  })
  rosterSize: number;

  @Column("varchar", {
    nullable: true,
    length: 255
  })
  grade: string;

  @OneToMany(type => Draw, draws => draws.event, {onDelete: 'CASCADE'})
  draws: Draw[];

  @OneToMany(type => Match, matches => matches.event, {onDelete: 'CASCADE'})
  matches: Match[];

  // Given an event object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiEvent: any) {
    this.eventCode = parseInt(apiEvent.Code);
    this.name = apiEvent.Name;
    switch (parseInt(apiEvent.GenderID)) {
      case 1:
      case 4:
        this.genderId = 'M';
        break;
      case 2:
      case 5:
        this.genderId = 'F';
        break;
      default:
        this.genderId = 'X';
    }
    if (null != apiEvent.LevelID) this.level = parseInt(apiEvent.LevelID);
    this.maxAge = (null != apiEvent.MaxAge) ? this.maxAge = parseInt(apiEvent.MaxAge) : 0;
    this.minAge = (null != apiEvent.MinAge) ? this.minAge = parseInt(apiEvent.MinAge) : 0;
    this.winnerPoints = (null != apiEvent.WinnerPoints) ? this.winnerPoints = parseInt(apiEvent.WinnerPoints) : 0;
    this.isSingles = (1 == parseInt(apiEvent.GameTypeID));
    this.categoryId = this.buildCategoryId();
    if (null != apiEvent.Grading) this.grade = apiEvent.Grading.Name;
  }

  // TODO This should be done by a lookup in categories.  And should be a foreign key.
  buildCategoryId():string {
    // Singles or doubles?
    let sd = this.isSingles ? "S" : "D";

    // Figure out what type of event is is based
    if (this.minAge > 28) {
      // looks like a senior's event
      return ("S" + this.genderId + sd + "O" + this.minAge);
    }
    if (this.maxAge < 19  && this.maxAge > 1) {
      // looks like a junior event
      return ("J" + this.genderId + sd + "U" + this.maxAge);
    }

    // we are assuming a level based (Adult) event
    // and we are assuming that the Level is therefore filled in.
    // TODO this should be gaurded a bit more.
    return ("A" + this.genderId + sd + "L" + this.level);
  }
}

