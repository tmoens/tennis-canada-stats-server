import { Injectable } from '@nestjs/common';
import * as delay from 'delay';
import {Job} from "kue";
import {getLogger} from "log4js";

const logger = getLogger("slowJobService");

// A service to simply stick long running jobs in a kue queue
// It just hides a few of the kue configuration details


// TODO set expiry
@Injectable()
export class SlowJobService {
  private queue;
  constructor() {
    let kue = require('kue');
    this.queue = kue.createQueue();
  }

  getQueue() {
    return this.queue;
  }

  // queue up a job for a client using kue.
  async queueJob(jobData: SlowJobData): Promise<number> {
    let job: Job = this.queue.create(jobData.name, jobData);
    job = job.save(function (err) {
      if (!err) {
        logger.info("Started slow job: " + JSON.stringify(job));
      } else {
        //TODO Important send an 500 error or something.
        logger.error("Failed to start slow job: " + JSON.stringify(job));
      }
    });

    // Problem: the .save() function returns immediately but the job.id
    // is not immediately available.  But we need the job.id be able to tell
    // the client so they can go poll kue for that job's progress.
    // But I am incompetent because I don;t know how to do this.
    // Instead I just kinda hang around until the job has an Id.
    // this should never take more than a few milliseconds, so put
    // a limit on how long we wait.
    let justInCase = 0;
    while (null == job.id) {
      if (100 < justInCase++) return -1;
      await delay(1);
    }
    logger.info(`waited ${justInCase} ms to save job ${job.id}`);
    return job.id;
  }

  // queue up a job for a client using kue.
  async getSlowJobStatus(jobId: number): Promise<any> {
    let j:Job;
    Job.get(jobId,function (err, job) {
      if (!err) {
        j = job;
      } else {
        //TODO Important send an 500 error or something.
        logger.error("Failed to fetch slow job: " + JSON.stringify(jobId));
      }
    });

    // Problem: the .get() function returns immediately but blah blah blah
    let justInCase = 0;
    while (null == j) {
      if (100 < justInCase++) return -1;
      await delay(1);
    }
    logger.info(`waited ${justInCase} ms to get job ${j.id}`);
    return JSON.stringify(j);
  }

}

export interface SlowJobData {
  name:string;
  toDoTask: string;
  toDoCount:number;
  doneCount:number;
  currentActivity:string;
}
