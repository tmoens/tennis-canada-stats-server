import {Controller, Get, Param} from '@nestjs/common';
import {SlowJobData, SlowJobService} from "./slow_job.service";


@Controller('slowjob')
export class SlowJobController {
  constructor(
    private readonly slowJobService: SlowJobService
  ) {}

  @Get("/status/:id")
  async getSlowJobStatus(@Param() params): Promise<any>{
    return await this.slowJobService.getSlowJobStatus(params.id);
  }


  @Get("/foo")
  async foo(): Promise<number> {
    let x:SlowJobData;
    x.name = "myname";
    x.toDoTask = "what I am supposed to do";
    x.currentActivity = "what I am busy doing";
    x.toDoCount = 43;
    x.doneCount = 4;
    return await this.slowJobService.queueJob(x);
  }

  @Get()
  handleEmptyGet(){
    console.log("emptyGet");
    // http 404?
  }
}
