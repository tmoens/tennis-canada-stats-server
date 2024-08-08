import { Entity, Column, ManyToOne, JoinColumn, VersionColumn } from 'typeorm';
import { ExternalPlayer } from '../external-player/external-player.entity';
import { ExternalEvent } from '../external-event/external-event.entity';

@Entity('itf_match_result')
export class ItfMatchResult {
  @Column({
    nullable: false,
    primary: true,
  })
  PlayerId: string;

  @Column({
    nullable: false,
    primary: true,
  })
  EventId: string;

  @ManyToOne(() => ExternalPlayer, (player) => player.matches, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'PlayerId' })
  player: ExternalPlayer | null;

  @Column('varchar', {
    nullable: false,
    primary: true,
    length: 50,
    name: 'MatchId',
  })
  MatchId: string;

  @ManyToOne(() => ExternalEvent, (event) => event.matches, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'EventId' })
  event: ExternalEvent | null;

  @Column('char', {
    nullable: true,
    length: 2,
    name: 'MatchStatus',
  })
  MatchStatus: string | null;

  @Column('char', {
    nullable: true,
    length: 3,
    name: 'ResultStatus',
  })
  ResultStatus: string | null;

  @Column('char', {
    nullable: true,
    length: 1,
    name: 'WinLossStatus',
  })
  WinLossStatus: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'Score',
  })
  Score: string | null;

  @Column('int', {
    nullable: true,
    name: 'PlayerSinglesRanking',
  })
  PlayerSinglesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'PlayerDoublesRanking',
  })
  PlayerDoublesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'PlayerCombinedRanking',
  })
  PlayerCombinedRanking: number | null;

  @Column('char', {
    nullable: true,
    length: 9,
    name: 'PartnerId',
  })
  PartnerId: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'PartnerGivenName',
  })
  PartnerGivenName: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'PartnerFamilyName',
  })
  PartnerFamilyName: string | null;

  @Column('char', {
    nullable: true,
    length: 3,
    name: 'PartnerNationality',
  })
  PartnerNationality: string | null;

  @Column('int', {
    nullable: true,
    name: 'PartnerSinglesRanking',
  })
  PartnerSinglesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'PartnerDoublesRanking',
  })
  PartnerDoublesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'PartnerCombinedRanking',
  })
  PartnerCombinedRanking: number | null;

  @Column('char', {
    nullable: true,
    length: 9,
    name: 'OppPlayerId',
  })
  OppPlayerId: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'OppGivenName',
  })
  OppGivenName: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'OppFamilyName',
  })
  OppFamilyName: string | null;

  @Column('char', {
    nullable: true,
    length: 3,
    name: 'OppNationality',
  })
  OppNationality: string | null;

  @Column('int', {
    nullable: true,
    name: 'OppSinglesRanking',
  })
  OppSinglesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'OppDoublesRanking',
  })
  OppDoublesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'OppCombinedRanking',
  })
  OppCombinedRanking: number | null;

  @Column('char', {
    nullable: true,
    length: 9,
    name: 'OppPartnerPlayerId',
  })
  OppPartnerPlayerId: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'OppPartnerGivenName',
  })
  OppPartnerGivenName: string | null;

  @Column('varchar', {
    nullable: true,
    length: 50,
    name: 'OppPartnerFamilyName',
  })
  OppPartnerFamilyName: string | null;

  @Column('char', {
    nullable: true,
    length: 3,
    name: 'OppPartnerNationality',
  })
  OppPartnerNationality: string | null;

  @Column('int', {
    nullable: true,
    name: 'OppPartnerSinglesRanking',
  })
  OppPartnerSinglesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'OppPartnerDoublesRanking',
  })
  OppPartnerDoublesRanking: number | null;

  @Column('int', {
    nullable: true,
    name: 'OppPartnerCombinedRanking',
  })
  OppPartnerCombinedRanking: number | null;

  @VersionColumn()
  version: number;
}
