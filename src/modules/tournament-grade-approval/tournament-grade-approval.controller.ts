import {
    ClassSerializerInterceptor,
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
    UseInterceptors
} from '@nestjs/common';
import {TournamentGradeApprovalService} from './tournament-grade-approval.service';
import {TournamentGradeApproval} from './tournament-grade-approval.entity';
import {Role} from '../../guards/role.decorator';
import {USER_ROLE} from '../auth/roles';
import {JwtAuthGuard} from '../../guards/jwt-auth.guard';
import {RoleGuard} from '../../guards/role-guard.service';

@UseInterceptors(ClassSerializerInterceptor)

@Controller('tournament-grade-approval')
export class TournamentGradeApprovalController {
    constructor(
        private readonly service: TournamentGradeApprovalService,
    ) {
    }

    @Role(USER_ROLE)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Get('/getApproval/:tournamentCode')
    async getMostRecentApproval(
        @Param('tournamentCode')  tournamentCode: string,
        @Request()  req,
    ): Promise<TournamentGradeApproval> {
        return await this.service.getMostRecentApproval(tournamentCode);
    }

    @Role(USER_ROLE)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Get('/getApprovalHistory/:tournamentCode')
    async getApprovalHistory(
        @Param('tournamentCode')  tournamentCode: string,
        @Request()  req,
        ): Promise<TournamentGradeApproval[]> {
        console.log(JSON.stringify(req.user));
        return await this.service.getApprovalHistory(tournamentCode);
    }

    @Role(USER_ROLE)
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Post('/create/:tournamentCode/:approvedGrade')
    async create(@Param('tournamentCode')  tournamentCode: string,
                 @Param('approvedGrade')  approvedGrade: string): Promise<TournamentGradeApproval | null> {
        return this.service.create(tournamentCode, approvedGrade);
    }

}
