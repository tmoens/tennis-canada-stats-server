import {Entity, Column} from 'typeorm';

@Entity('point_exchange')
export class PointExchange {

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'exchangeId',
  })
  exchangeId: number;

  @Column('int', {
    nullable: false,
    name: 'year',
    comment: 'The year the exchange is valid for. Allows changes year over year.',
  })
  year: number;

  @Column('varchar', {
    nullable: false,
    length: 40,
    name: 'sourceCurrency',
    comment: 'The  currency we are exchanging from (ATP/WTA/ITF Entry/ITF Junior)',
  })
  sourceCurrency: string;

  @Column('char', {
    nullable: true,
    length: 1,
    name: 'gender',
    comment: 'M/F',
  })
  gender: string | null;

  @Column('varchar', {
    nullable: true,
    length: 30,
    name: 'targetCurrency',
    comment: 'The currency we are exchanging to in Tennis Canada Rankings - Open or Junior',
  })
  targetCurrency: string | null;

  @Column('int', {
    nullable: true,
    name: 'pointExchangeRate',
    comment: 'The exchange rate in use.',
  })
  pointExchangeRate: number;
}
