import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {TournamentGradeApproval} from './tournament-grade-approval.entity';
import {Repository} from 'typeorm';

@Injectable()
export class TournamentGradeApprovalService {
    constructor(
        @InjectRepository(TournamentGradeApproval) private readonly repo: Repository<TournamentGradeApproval>,
    ) {}

    async getMostRecentApproval(tournament: string): Promise<TournamentGradeApproval | null> {
        const mostRecentApproval: TournamentGradeApproval = await this.repo.createQueryBuilder('a')
            .where('a.tournament = :tournamentCode', {tournamentCode: tournament})
            .orderBy('a.creationDate', 'DESC')
            .getOne();
        if (mostRecentApproval) {
            return mostRecentApproval;
        } else {
            return null;
        }
    }

    async getApprovalHistory(tournament: string): Promise<TournamentGradeApproval[]> {
        return await this.repo.createQueryBuilder('a')
            .where('a.tournament = :tournamentCode', {tournamentCode: tournament})
            .orderBy('a.creationDate', 'DESC')
            .getMany();
    }

    async create(tournament: string, level: string) {
        const approval = new TournamentGradeApproval();
        approval.tournament = tournament;
        approval.approvedLevel = level;
        approval.approvingUser = 'tbd';
        return await this.repo.save(approval);
    }
}
