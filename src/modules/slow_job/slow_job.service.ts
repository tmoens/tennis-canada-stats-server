import { Injectable } from '@nestjs/common';
import * as kue from 'kue'

// A service to simply stick long running jobs in a kue queue
// It just hides a few of the kue configuration details and generically
// adds a special random number identifier.
// TODO set expiry
@Injectable()
export class SlowJobService {
  private queue;
  constructor() {
    let kue = require('kue');
    this.queue = kue.createQueue();
  }

  // queue up a job for a client using kue.
  // TODO Problem: the .save() function does not return right away
  // so I do not get the job and consequently the job id until
  // after this function has returned.  I want to be able to tell
  // the client so they can go poll kue for that job's progress.
  // But I am incompetent because I don;t know how.
  // Instead I add an extra random id to the job which
  // I *can* tell the client about and which the client can use
  // to go get progress.
  // It is a long freaking workaround and I hate it.
  queueJob(name:string, data: string): number {
    let rid:number  = Math.floor(Math.random() * 1000000);
    let dj = JSON.parse(data);
    dj.rid = rid.toString();
    let job = this.queue.create(name,dj)
      .save(function (err) {
        if (!err) {
          console.log(job.id); // works as expected
        } else {
          //TODO send an 500 error?
          console.log("save seems to have error");
        }
      });
    //console.log(job.id);  ==> undefined at this point ergo the problem;
    return rid;
  }
}


