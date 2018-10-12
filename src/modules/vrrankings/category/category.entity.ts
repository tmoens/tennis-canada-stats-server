import {Index, Entity, Column, ManyToOne, JoinColumn, OneToMany} from 'typeorm';
import {VRRankingsType} from '../type/type.entity';
import {VRRankingsPublication} from '../publication/publication.entity';

@Entity('VRRankingsCategory')
@Index('categoryId', ['categoryId'], {unique: true})
@Index('vrRankingsType', ['vrRankingsType'])
export class VRRankingsCategory {

  @Column('varchar', {
    length: 255,
    primary: true,
    comment: 'VR UUID for the ranking category (M 4.5 singles/W O65 doubles/Girls U16 singles, etc.).',

  })
  categoryCode: string;

  @ManyToOne(type => VRRankingsType, vrRankingsType => vrRankingsType.vrRankingsCategories, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'typeCode'})
  vrRankingsType: VRRankingsType;

  // expose the typeCode without having to load the whole VRRankingsType object
  @Column('varchar', {
    length: 255,
  })
  typeCode: string;

  @Column('varchar', {
    unique: true,
    length: 10,
    comment : 'A more human interpretable version of the category.',
  })
  categoryId: string;

  @Column('varchar', {
    length: 25,
  })
  categoryName: string;

  @Column('tinyint', {
    width: 1,
    default: 1,
    comment: 'Do we download these rankings for Tennis Canada stats history?',
  })
  loadMe: boolean;

  @OneToMany(type => VRRankingsPublication, publications => publications.rankingsCategory, {onDelete: 'CASCADE'})
  publications: VRRankingsPublication[];

  constructor(code: string, rt: VRRankingsType, id: string, name: string, load: boolean) {
    this.categoryCode = code;
    this.vrRankingsType = rt;
    this.categoryId = id;
    this.categoryName = name;
    this.loadMe = load;
  }
}