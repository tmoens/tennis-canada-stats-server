import {
  Index,
  Entity,
  Column,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { ExternalEvent } from '../external-event/external-event.entity';

@Entity('external_tournament')
@Index('endDate', ['endDate'])
@Index('name', ['name'])
export class ExternalTournament {
  @PrimaryColumn('varchar', {
    nullable: false,
    primary: true,
    length: 50,
    name: 'tournamentId',
    comment: 'The external identifier of this tournament allows for UUID.',
  })
  tournamentId: string;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'name',
  })
  name: string | null;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'zone',
  })
  zone: string | null;

  @Column('varchar', {
    nullable: true,
    length: 200,
    name: 'hostNation',
  })
  hostNation: string | null;

  @Column('varchar', {
    nullable: true,
    length: 10,
    name: 'sanctioningBody',
    comment:
      'Sanctioning body will necessarily be one from the event_rating table',
  })
  sanctioningBody: string | null;

  @Column('varchar', {
    nullable: true,
    length: 40,
    name: 'category',
    comment:
      'Category body will necessarily be one from the event_rating table',
  })
  category: string | null;

  @Column('varchar', {
    nullable: true,
    length: 20,
    name: 'subCategory',
    comment:
      'sub-category body will necessarily be one from the event_rating table',
  })
  subCategory: string | null;

  @Column('date', {
    nullable: true,
    name: 'startDate',
    comment: 'Not presently used by the system',
  })
  startDate: string | null;

  @Column('date', {
    nullable: false,
    name: 'endDate',
  })
  endDate: string;

  @OneToMany(() => ExternalEvent, (externalEvent) => externalEvent.tournament, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  externalEvents: ExternalEvent[];

  @UpdateDateColumn()
  updateDate: Date;
  @VersionColumn()
  version: number;

  getTournamentYear(): number | null {
    return Number(this.endDate.slice(0, 4));
  }

  getPointCurrency(): string {
    // All ATP tournaments deal in ATP points.
    if (this.sanctioningBody === 'ATP') return 'ATP';
    // ALL WTA Tournaments deal in WTA Points.
    if (this.sanctioningBody === 'WTA') return 'WTA';
    // ITF tournaments can deal in ITF Junior points or TransitionTour points or WTA points.
    if (this.sanctioningBody === 'ITF') {
      // All ITF Junior tournaments deal with ITF (junior points
      if (this.tournamentId.slice(0, 1) === 'J') {
        return 'ITF';
      }
      // All ITF Men's Open tournaments deal in transitionTour Points.
      if (this.tournamentId.slice(0, 1) === 'M') {
        return 'TT';
      }
      // ITF Women's Tournaments could deal in WTA or TT points
      if (this.category === 'TT') {
        return 'TT';
      } else {
        return 'WTA';
      }
    }
  }
}
