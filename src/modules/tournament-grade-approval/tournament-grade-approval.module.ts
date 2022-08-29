import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {TournamentGradeApproval} from './tournament-grade-approval.entity';
import { TournamentGradeApprovalService } from './tournament-grade-approval.service';
import { TournamentGradeApprovalController } from './tournament-grade-approval.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([TournamentGradeApproval]),
    ],
    providers: [
        TournamentGradeApprovalService,
    ],
    controllers: [
        TournamentGradeApprovalController,
    ],
    exports: [
        TournamentGradeApprovalService,
    ],
})
export class TournamentGradeApprovalModule {}
