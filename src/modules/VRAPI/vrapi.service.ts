import { Injectable } from '@nestjs/common';
import * as request from "superagent";
import {getLogger} from "log4js";
import {ConfigurationService} from "../configuration/configuration.service";
const HttpsAgent = require('agentkeepalive').HttpsAgent;

const logger = getLogger("vrapi");

const parseString = require('xml2js').parseString;

// OK, so what the heck is this agent?
// Well, if you do not use it, the "normal" agent will open up a new
// socket connection for each call to the VRAPI.  The VRAPI gets a
// a little testy about that and at some point says, does not accept
// any more connections ETIMEDOUT or some such thing.  So we have
// to push all our request down a number of sockets which we keep
// alive.  This line plus the use of one below where the agent is
// used cost about 6 hours.  Hence this rememory note.
const keepaliveAgent = new HttpsAgent({maxSockets: 10});

// Simply makes a call to the VRAPI and converts the returned XML into
// a javascript object and returns it.
//
// It is up to the caller to know what is expected to be in the object
// returned by the VR API.

@Injectable()
export class VRAPIService {

  constructor(
    private readonly config: ConfigurationService) {
    logger.info("API User: " + config.vrapiUser);
  }
  async get(pattern:string = ""): Promise<any> {
    let r: any = {};

    // Note, the VRAPI seemed to be timing out sometimes.  So we will
    // retry the call up to three times.
    // The timeout should probably not be happening - need to ask VR why.
    let done = false;
    let retryLimit: number = 3;
    let retryCount: number = 0;
    while (!done )
      try {
        logger.info("calling: https://api.tournamentsoftware.com/1.0/" + pattern);
        let response = await request
          .get("https://api.tournamentsoftware.com/1.0/" + pattern)
          .agent(keepaliveAgent)
          .auth(this.config.vrapiUser, this.config.vrapiPassword);
        done = true;

        parseString(response.text,{explicitArray:false, mergeAttrs:true }, function(err,result) {
          r = result.Result;
        });
      } catch (e) {
        logger.warn("Error calling VR API: " + e);
        retryCount++;
        // TODO handle failure after multiple retries
        if (retryCount == retryLimit) {
          done = true;
          logger.error("Multiple retries failed");
        }
      }
    return r;
  }
}