import {Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, Index} from "typeorm";
import {Player} from "../../player/player.entity";
import {Match} from "../match/match.entity";

@Entity("MatchPlayer")
@Index(["match", "team", "position"], { unique: true })

export class MatchPlayer {

  // I struggled to use the matchId+team+position as the primary key
  // but things got hairy when trying to do an update.
  @PrimaryGeneratedColumn()
  matcPlayerId;

  @ManyToOne(type=>Match, matchId=>matchId.matchPlayers,{
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name:'matchId'})
  match:Match;

  @ManyToOne(type=>Player,{
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name:'playerId'})
  player:Player;

  // This "column" just give access to the player Id value
  // without having to load the entire player object.
  @Column()
  playerId:number;

  @Column("int", {
    comment: "1 or 2 allows for singles and doubles to be handled generically."
  })
  team:number;

  @Column("int", {
    comment: "1 or 2",
  })
  position:number;

  constructor (match:Match, player:Player, team:number, position:number) {
    this.match = match;
    this.player = player;
    this.team = team;
    this.position = position;
  }
}
