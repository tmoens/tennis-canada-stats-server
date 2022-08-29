// A DTO holding information about the current and approved grade for a league or tournament.
import {Tournament} from './tournament.entity';
import {TournamentGradeApproval} from '../../tournament-grade-approval/tournament-grade-approval.entity';

export class GradingDTO {
    name: string;
    type: string;
    tournamentCode: string;
    vrGrade: string;
    approvedGrade: string = null;
    endDate: string;

    constructor(t: Tournament, g: TournamentGradeApproval | null) {
        this.tournamentCode = t.tournamentCode;
        this.name = t.name;
        this.vrGrade = t.level;
        if (g) {
            this.approvedGrade = g.approvedLevel;
        }
        this.endDate = t.endDate;
        if (t.typeId === 0) {
            this.type = 'Tournament';
        } else {
            this.type = 'League';
        }
    }
}
