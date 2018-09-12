import { DrawService } from './draw.service';
import { DrawController } from './draw.controller';
import { Draw } from './draw.entity';
import {VRAPIModule} from "../../VRAPI/vrapi.module";
import {MatchModule} from "../match/match.module";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Module} from "@nestjs/common";

@Module({
  imports: [
    TypeOrmModule.forFeature([Draw]),
    VRAPIModule,
    MatchModule,
  ],
  providers: [
    DrawService
  ],
  controllers: [
    DrawController
  ],
  exports: [DrawService]
})
export class DrawModule {}
