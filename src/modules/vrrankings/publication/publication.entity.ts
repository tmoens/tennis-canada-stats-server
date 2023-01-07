import {
  Index,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import {VRRankingsCategory} from '../category/category.entity';
import {VRRankingsItem} from '../item/item.entity';

/**
 * NOTE
 * To VR, a publication is per type of ranking (adult/junior/senior/wheelchair)
 * We create a separate publication object for each category within the type of ranking.
 * This makes the retrieval of a particular ranking list
 * (e.g. 2015 week 2 under 16 girls doubles) much more efficient.
 *
 */

@Entity('vrrankingspublication')
@Index('publicationCode', ['publicationCode'])
export class VRRankingsPublication {

  @PrimaryGeneratedColumn()
  publicationId: number;

  @Column('varchar', {
    length: 255,
    comment: 'The code for the VR publication. Shared by all the categories in a specific VR publication.',
  })
  publicationCode: string;

  @ManyToOne(type => VRRankingsCategory, rankingsCategory => rankingsCategory.publications, {
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({name: 'categoryCode'})
  rankingsCategory: VRRankingsCategory;

  @Column()
  year: number;

  @Column()
  week: number;

  @Column('datetime', {
    nullable: false,
    comment: 'publication date of the ranking.',
  })
  publicationDate: Date;

  @CreateDateColumn()
  tcCreatedAt: Date;

  @OneToMany(type => VRRankingsItem, items => items.publication, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  items: VRRankingsItem[];

  // Check if our copy of the publication is older than when the rankings were generated in VR
  isOutOfDate(generatedDate: string): boolean {
    // We have to truncate milliseconds from the incoming "generatedDate" time
    // Because mysql does the same when it stores the value, and we need to
    // compare the two, so we know if ours is out of date.
    const gd: Date = new Date(generatedDate);
    gd.setMilliseconds(0);
    return (null == this.tcCreatedAt || this.tcCreatedAt < gd);
  }

  // Given a publication object from the VR API, fill in our own fields
  buildFromVRAPIObj(apiPublication: any) {
    this.publicationCode = apiPublication.Code;
    this.year = parseInt(apiPublication.Year, 10);
    this.week = parseInt(apiPublication.Week, 10);
    this.publicationDate = new Date(apiPublication.PublicationDate);
  }
}
