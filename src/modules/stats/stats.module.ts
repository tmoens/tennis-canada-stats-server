import {Global, Module} from "@nestjs/common";
import {StatsService} from "./stats.service";

// Just used to keep count of things.  Like how many tournaments were updated
// or how many players were updated during the latest import operation.
@Global()
@Module({
  imports: [
  ],
  providers: [
    StatsService,
  ],
  controllers: [
  ],
  exports: [
    StatsService,
  ]
})
export class StatsModule{}