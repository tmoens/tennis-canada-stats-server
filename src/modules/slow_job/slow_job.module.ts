import {Module} from "@nestjs/common";
import {SlowJobService} from "./slow_job.service";
import {SlowJobController} from "./slow_job.controller";

@Module({
  providers: [
    SlowJobService,
  ],
  controllers: [
    SlowJobController,
  ],
  exports: [
    SlowJobService,
  ]
})
export class SlowJobModule{}