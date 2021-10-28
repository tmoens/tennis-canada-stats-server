import {Entity, PrimaryColumn, Column, OneToMany} from 'typeorm';
import {VRRankingsCategory} from '../category/category.entity';

@Entity('VRRankingsType')
export class VRRankingsType {

  @PrimaryColumn('varchar',{
    length:255,
    comment: 'VR UUID for the ranking type (adult/junior/Senior)'
  })
  typeCode:string;

  @Column('varchar',{
    length:255
  })
  typeName:string;

  @OneToMany(type=>VRRankingsCategory,
      vrrankingscategories=>vrrankingscategories.vrRankingsType,{ onDelete: 'CASCADE' })
  vrRankingsCategories:VRRankingsCategory[];

  constructor(code:string, name:string) {
    this.typeCode = code;
    this.typeName = name;
  }
}
