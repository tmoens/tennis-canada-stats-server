import { Injectable } from '@nestjs/common';
import {getLogger} from "log4js";

const logger = getLogger("stats")

@Injectable()
export class StatsService {
  private counters: any = {};

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

  resetAll(): void {
    this.counters = {};
  }

  get(counterName:string): number {
    if (null == this.counters[counterName]) {
      return -1;
    } else {
      return this.counters[counterName];
    }
  }

  log(counters: string[]) {
    counters.forEach(name => {
      console.log(name + ": " + this.get(name));
    })
  }

  logAll() {
      logger.info(JSON.stringify(this.counters));
  }
}