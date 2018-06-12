import { TennisAssociationService } from './tennis_association.service';
import { TennisAssociationController } from './tennis_association.controller';
import { TennisAssociation } from './tennis_association.entity';
import {StatsModule} from "../stats/stats.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";

@Module({
  imports: [
    TypeOrmModule.forFeature([TennisAssociation]),
    StatsModule,
  ],
  providers: [
    TennisAssociationService
  ],
  controllers: [
    TennisAssociationController
  ],
  exports: [TennisAssociationService]
})
export class TennisAssociationModule {}
