import {Column, Entity, OneToMany, PrimaryColumn} from 'typeorm';
import {Tournament} from '../tournament/tournament.entity';

@Entity()
export class License {
  @PrimaryColumn('varchar', {
    length: 255,
  })
  licenseName: string;

  // Note: "province" is a misnomer, it should have been tennisAssociation
  @Column('varchar', {
    nullable: false,
    length: 3,
  })
  province: string;

  @OneToMany(type => Tournament, tournaments => tournaments.license)
  tournaments: Tournament[];

  constructor(n: string, p: string) {
    this.licenseName = n;
    this.province = p;
  }
}

export class LicenseDTO {
  readonly licenseName: string;
  readonly province: string;
}
