import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TournamentService } from './tournament.service';
import { TournamentController } from './tournament.controller';
import { Tournament } from './tournament.entity';
import { VRAPIModule } from '../../VRAPI/vrapi.module';
import { EventModule } from '../event/event.module';
import { LicenseModule } from '../license/license.module';
import { TournamentGradeApprovalModule } from '../../tournament-grade-approval/tournament-grade-approval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament]),
    PassportModule,
    VRAPIModule,
    EventModule,
    LicenseModule,
    TournamentGradeApprovalModule,
  ],
  providers: [TournamentService],
  controllers: [TournamentController],
  exports: [TournamentService],
})
export class TournamentModule {}
