import { Test, TestingModule } from '@nestjs/testing';
import { TournamentGradeApprovalController } from './tournament-grade-approval.controller';

describe('TournamentGradeApprovalController', () => {
  let controller: TournamentGradeApprovalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentGradeApprovalController],
    }).compile();

    controller = module.get<TournamentGradeApprovalController>(
      TournamentGradeApprovalController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
