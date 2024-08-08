import { Injectable } from '@nestjs/common';
import * as request from 'superagent';
import { getLogger } from 'log4js';
import { ConfigurationService } from '../configuration/configuration.service';
import { HttpsAgent } from 'agentkeepalive';
import { parseString } from 'xml2js';

const logger = getLogger('vrapi');

// OK, so what the heck is this agent?
// Well, if you do not use it, the "normal" agent will open up a new
// socket connection for each call to the VRAPI.  The VRAPI gets a
// little testy about that and at some point says, does not accept
// any more connections ETIMEDOUT or some such thing.  So we have
// to push all our request down a number of sockets which we keep
// alive.  This line plus the use of one below where the agent is
// used cost about 6 hours.  Hence, this rememory note.
const keepaliveAgent = new HttpsAgent({ maxSockets: 10 });

// Simply makes a call to the VRAPI and converts the returned XML into
// a javascript object and returns it.
//
// It is up to the caller to know what is expected to be in the object
// returned by the VR API.

@Injectable()
export class VRAPIService {
  constructor(private readonly config: ConfigurationService) {
    logger.info('API User: ' + config.vrapiUser);
  }
  async get(pattern: string = ''): Promise<any> {
    let r: any = {};

    // Note, the VRAPI seemed to be timing out sometimes.  So we will
    // retry the call up to three times.
    // The timeout should probably not be happening - need to ask VR why.
    let done = false;
    const retryLimit: number = 3;
    let retryCount: number = 0;
    while (!done)
      try {
        logger.info(
          'calling: https://api.tournamentsoftware.com/1.0/' + pattern,
        );
        const response = await request
          .get('https://api.tournamentsoftware.com/1.0/' + pattern)
          .agent(keepaliveAgent)
          .auth(this.config.vrapiUser, this.config.vrapiPassword);
        done = true;

        parseString(
          response.text,
          { explicitArray: false, mergeAttrs: true },
          (err, result) => {
            r = result.Result;
          },
        );
      } catch (e) {
        logger.warn('Error calling VR API: ' + e);
        retryCount++;
        // TODO handle failure after multiple retries
        if (retryCount === retryLimit) {
          done = true;
          logger.error('Multiple retries failed');
        }
      }
    return r;
  }

  /*
   * In several places the vr api returns XML that can be
   * - empty,
   * - exactly one item
   * - a list of items
   * Examples: events in a tournament or entries in an event or matches in a draw.
   *
   * Because the xml2js parser is configured not to convert every single
   * child node into an array (explicitArray: false), it only creates an
   * array in the third case.
   *
   * But in fact, for those XML nodes which we know we want to treat as lists
   * (such as the above examples) we build an array for the first two cases.
   *
   */

  static arrayify(putativeArray: any): any[] {
    if (null == putativeArray) {
      return [];
    } else if (Array.isArray(putativeArray)) {
      return putativeArray;
    } else {
      return [putativeArray];
    }
  }
}
