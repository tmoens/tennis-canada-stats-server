import {Entity, Column} from 'typeorm';

@Entity('event_rating')
export class EventRating {

  @Column('int', {
    nullable: false,
    primary: true,
    name: 'ratingId',
  })
  ratingId: number;

  @Column('int', {
    nullable: false,
    name: 'year',
    comment: 'The year the rating is valid for. Allows changes year over year. Also, all rating must be renewed annually.',
  })
  year: number;

  @Column('varchar', {
    nullable: false,
    length: 40,
    name: 'sanctioningBody',
    comment: 'The sanctioning body for the tournament. e.g. ITF, USTA, WTA',
  })
  sanctioningBody: string;

  @Column('varchar', {
    nullable: true,
    length: 30,
    name: 'category',
    comment: 'Category of tournament. e.g ITF supports Grades A, B, 1, 2, 3, 4, 5',
  })
  category: string | null;

  @Column('varchar', {
    nullable: true,
    length: 30,
    name: 'subCategory',
    comment: 'Sub-Category of a tournament. e.g. ATP Challengers has several sub-categories.',
  })
  subCategory: string | null;

  @Column('varchar', {
    nullable: true,
    length: 7,
    name: 'eventGender',
    comment: 'Gender of the event. Male or Female',
  })
  eventGender: string | null;

  @Column('varchar', {
    nullable: true,
    length: 30,
    name: 'eventType',
    comment: 'Type of event. e.g. Open, U18, U16. Note that we do not distinguish between Doubles and Singles',
  })
  eventType: string | null;

  @Column('decimal', {
    nullable: false,
    precision: 16,
    scale: 5,
    name: 'eventRating',
    comment: 'The rating of the event as a multiplier to the rating of the Canadian U18 National championships.',
  })
  eventRating: number;

  @Column('decimal', {
    nullable: false,
    precision: 16,
    scale: 5,
    name: 'sanctioningBodyRating',
    comment: 'A rating applied to all events for a particular sanctioning body. Used to convert ATP and WTA events to TC Points.',
  })
  sanctioningBodyRating: number;

  @Column('int', {
    nullable: true,
    name: 'pointExchangeRate',
    comment: 'A value used to convert ATP, WTA and ITF points directly to Junior Rankings points (2018+)',
  })
  pointExchangeRate: number;
}
