import {getLogger} from "log4js";

/*
 * A very small object to track the status of long running jobs.
 * By keeping one of these up to date, the server can answer
 * client polling for the status of a job.
 *
 * Used for things like uploading big player spreadsheets
 * or building reports for the client.
 */

const logger = getLogger("jobstats")

export class JobStats {
  name:string;
  startTime: Date;
  endTime: Date;
  status: JobState;
  currentActivity: string;
  toDo:number;
  // anything the client wants to remember about the job
  data: any;


  private counters: any = {};

  constructor(name: string) {
    this.name = name;
    this.startTime = new Date();
    this.status = JobState.NOT_STARTED;
    this.toDo = -1; // If it is -1 it is not known yet.
    this.counters.done = 0;
  }

  bump(counterName:string): number {
    if (null == this.counters[counterName]) {
      this.counters[counterName] = 1;
    } else {
      this.counters[counterName] = this.counters[counterName] + 1;
    }
    return this.counters[counterName];
  }

  resetCounter(counterName:string): number {
    this.counters[counterName] = 0;
    return this.counters[counterName];
  }

  resetCounters(counters: string[]) {
    counters.forEach(name => {
      this.resetCounter(name);
    })
  }

  get(counterName:string): number {
    if (null == this.counters[counterName]) {
      return -1;
    } else {
      return this.counters[counterName];
    }
  }

  setStatus(state: JobState) {
    this.status = state;
    if (JobState.DONE == state) {
      logger.info("Job complete: " + JSON.stringify(this));
    }
    if (JobState.ERROR == state) {
      logger.error("Job failed: " + JSON.stringify(this));
    }
  }
}

export enum JobState {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
  ERROR = "Error",
}