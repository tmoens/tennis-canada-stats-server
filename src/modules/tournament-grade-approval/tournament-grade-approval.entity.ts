import {
  Index,
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

/**
 * Each TournamentGradeApproval just records the fact that an administrator at Tennis
 * Canada said that tournament X is approved at level y, by some user at some point in time.
 * There can be multiple approvals for a single tournament.
 * "It's Provincial says Jeannie on 2022-08-25",
 * "No it's National says Brian on 2022-08-29",
 * "No it's Provincial says Arun on 2022-09-16".
 * We keep the approval history.
 */

/** Design notes:
 * When a tournament is found to have been updated in VR it is *wiped out* from the
 * tc_stats database - all the events, players and matches are removed.
 * Then the updated version of the tournament gets added back.  This works well for
 * keeping everything from VR up to date.
 *
 * BUT we have to take care NOT to wipe out approvals for that tournament.
 * Therefore, the tournament code recorded in the approval *is not* a foreign key and is
 * not modeled as a relation to the tournament it relates to.
 *
 * Also, there is no reverse relationship for all the approvals for a given tournament.
 *
 * Consequently, once an approval for a tournament gets in the database, it can never come out.
 * No big deal, just worth knowing. There will be only a few per year if used for leagues only,
 * or a few thousand a year if used for Tournaments.
 */

@Entity()
@Index('tournament', ['tournament'])
export class TournamentGradeApproval {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', {
    nullable: false,
    length: 255,
  })
  tournament: string;

  @Column('varchar', {
    nullable: false,
    length: 255,
  })
  approvedLevel: string;

  @Column('varchar', {
    nullable: false,
    length: 255,
  })
  approvingUser: string;

  @CreateDateColumn()
  creationDate: Date;
}
