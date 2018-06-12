import {Controller, Get} from '@nestjs/common';
import {SlowJobService} from "./slow_job.service";

@Controller('slowjob')
export class SlowJobController {
  constructor(
    private readonly queue: SlowJobService
  ) {}

  @Get("/UTRReport")
  handleUTRReport(): number {
    return this.queue.queueJob("UTRReport",'{"from": "hick"}');
  }

  @Get("/vrimport")
  handleVRImport(): number {
    return this.queue.queueJob("VR Importer",'{"a": "a"}');
  }

  @Get()
  handleEmptyGet(){
    console.log("emptyGet");
    // http 404?
  }
}
