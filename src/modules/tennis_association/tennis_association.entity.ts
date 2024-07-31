import {Entity, Column, PrimaryGeneratedColumn} from 'typeorm';

@Entity('tennisassociation')
export class TennisAssociation {

  @PrimaryGeneratedColumn()
  tennisAssociationId:number;

  @Column('varchar',{
    length:255
  })
  name: string;

  @Column('varchar',{
    length:255
  })
  regionName: string;

  @Column('varchar',{
    length:255
  })
  regionAbbrv: string;

  @Column('varchar',{
    length:255
  })
  url: string;

  @Column('varchar',{
    length:255
  })
  vrURL: string;


  constructor(rn:string, ra:string, n:string, url:string, vrUrl:string) {
    this.name = n;
    this.regionName = rn;
    this.regionAbbrv = ra;
    this.url = url;
    this.vrURL = vrUrl;
  }

}
