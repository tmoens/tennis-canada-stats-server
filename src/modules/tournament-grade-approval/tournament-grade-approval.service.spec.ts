import { Test, TestingModule } from '@nestjs/testing';
import { TournamentGradeApprovalService } from './tournament-grade-approval.service';

describe('TournamentGradeApprovalService', () => {
  let service: TournamentGradeApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TournamentGradeApprovalService],
    }).compile();

    service = module.get<TournamentGradeApprovalService>(TournamentGradeApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
