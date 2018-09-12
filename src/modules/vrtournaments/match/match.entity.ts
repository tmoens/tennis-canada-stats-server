import {Index, Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, OneToMany} from "typeorm";
import {Event} from "../event/event.entity";
import {Draw} from "../draw/draw.entity";
import {MatchPlayer} from "../match_player/match_player.entity";

@Entity("Match")
@Index("event",["event",])
@Index("draw",["draw",])
export class Match {

  @PrimaryGeneratedColumn()
  matchId:number;

  @ManyToOne(type=>Event, eventId=>eventId.matches,{
    nullable:false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' })
  @JoinColumn({ name:'eventId'})
  event:Event;

  @ManyToOne(type=>Draw, drawId=>drawId.matches,{
    nullable:false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' })
  @JoinColumn({ name:'drawId'})
  draw:Draw;

  @Column("int",{
    comment: "VRs code for this match "
  })
  vrMatchCode:number;

  @Column("int",{
    comment: "The VR number of the draw (in the tournament) in which this match happened"
  })
  vrDrawCode:number;

  @Column("int",{
    comment: "The VR number of the event (in the tournament) in which this match happened"
  })
  vrEventCode:number;

  @Column("int",{
    name:"winnerCode",
    comment: "as per VR data. 0: none, 1: team 1, 2: team2, 3: tie"
  })
  winnerCode:number;

  @Column("int",{
    name:"scoreStatus",
    comment: "0: normal, 1: walkover, 2: retirement, 3:dq, 4: no match, 5: bye"
  })
  scoreStatus:number;

  @OneToMany(type => MatchPlayer, matchPlayers => matchPlayers.match, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  matchPlayers: MatchPlayer[];

  @Column("varchar",{
    length:255
  })
  score:string;

  // Given an event object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiMatch: any) {
    this.vrMatchCode = parseInt(apiMatch.Code);
    this.vrDrawCode = parseInt(apiMatch.DrawCode);
    this.vrEventCode = parseInt(apiMatch.EventCode);
    this.winnerCode = parseInt(apiMatch.Winner);
    this.scoreStatus = parseInt(apiMatch.ScoreStatus);

    let scoreString:string  = "";
    switch (this.scoreStatus) {
      case 0: // Normal
        // console.log ("Sets:\n" + JSON.stringify(apiMatch.Sets));
        if (null == apiMatch.Sets) {
          if (null == apiMatch.Team1.Player1 || null == apiMatch.Team2.Player1) {
            this.score = "Bye";
          }
        } else {
          // The sets will come back as an array only if there are two or more
          // so we need to fix that up a bit.
          let sets: any[];
          if (Array.isArray(apiMatch.Sets.Set)) {
            sets = apiMatch.Sets.Set;
          } else {
            sets = [apiMatch.Sets.Set];
          }

          let score = [];// one element for each set to be joined later.
          for (let i = 0; i < sets.length; i++) {
            let setScoreData = sets[i];
            if (apiMatch.Winner == 2) {
              score.push(setScoreData.Team2 + "-" + setScoreData.Team1);
            } else {
              score.push(setScoreData.Team1 + "-" + setScoreData.Team2);
            }
          }
          this.score = score.join(", ");
        }
        break;
      case 1:
        this.score = "Walkover";
        break;
      case 2:
        this.score = "Retirement";
        break;
      case 3:
        this.score = "Disqualification";
        break;
      case 4:
        this.score = "Unknown";
        break;
    }
  }
}
