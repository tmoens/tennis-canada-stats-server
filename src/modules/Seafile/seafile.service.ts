import { Injectable } from '@nestjs/common';
import {getLogger} from 'log4js';
import {ConfigurationService} from '../configuration/configuration.service';
import * as fs from 'fs';
import * as request from 'superagent';
const rp = require('request-promise');

const logger = getLogger('seafile');

@Injectable()
export class SeafileService {
  constructor(
    private readonly config: ConfigurationService) {
  }

  // upload a file to the seafile server
  async uploadFile(filename: string): Promise<boolean> {
    logger.info('Uploading file: ' + filename);

    const token: string = await this.requestToken();
    if (null === token) return false;
    const repo = await this.findRepo(token);
    if (null === repo) return false;
    const uploadLink: string = await this.getUploadLink(token, repo);
    if (null === repo) return false;

    const filestream = fs.createReadStream(filename);

    // The following commented out section is the culmination of
    // 6 hours of frustration and failure.  The result is that I
    // am not using superagent's request, but rather the vanilla
    // request to make the next call.  If you look at the (working)
    // vanilla code below, maybe you can tell me what I am doing wrong.
    // const formData =
    //   { file:
    //       { value: filestream,
    //         options:
    //           { filename: filename,
    //             contentType: null ,
    //           },
    //       },
    //     parent_dir: '/',
    //   };
    //
    // try {
    //   const response = await request
    //     .post(uploadLink)
    //     .set('Authorization', 'Token ' + token)
    //     .set('Cache-Control', 'no-cache')
    //     .set('Content-Type', 'multipart/form-data')
    //     .send(formData);
    //   logger.info('file uploaded');
    //   console.log (JSON.stringify(response))
    //   return true;
    // } catch (e) {
    //   logger.error('Error uploading file: ' + e);
    //   return false;
    // }

    const options = { method: 'POST',
      url: uploadLink,
      headers:
        { 'Authorization': 'Token ' + token,
          'Cache-Control': 'no-cache',
          'content-type': 'multipart/form-data',
        },
      formData:
        { file:
            { value: filestream,
              options:
                { filename,
                  contentType: null ,
                },
            },
          parent_dir: '/' },
    };

    rp(options)
      .then(body => {
        logger.info('Upload successful.');
      })
      .catch(error => {
        logger.error('Error uploading file: ' + error);

      });

    // await xrequest(options, (error, response, body) => {
    //   if (error) {
    //     logger.error('Error uploading file: ' + error);
    //     return false;
    //   }
    //   logger.info('Upload successful.');
    //   return true;
    // });
  }

  // request a token from the seafile server to use for authentication
  // of further operations
  async requestToken(): Promise<string> | null {
    try {
      const response = await request
        .post(this.config.seafileURL + '/auth-token/')
        .set('Accept', 'application/json')
        .send({ username: this.config.seafileUserId, password: this.config.seafilePassword });
      logger.info('Token acquired.');
      return JSON.parse(response.text).token;
    } catch (e) {
      logger.error('Error getting auth-token from seafile. ' +
        'Check user name and password in configuration. Error: ' + e);
      return null;
    }
  }

  // We need to look up the seafile repository to which we plan to send files
  // We wanted to do a search by name but that part of the API is not supported
  // on our seafile server, so instead we load all the repos and look for the
  // one we want.
  async findRepo(token: string): Promise<any> | null {
    try {
      const response = await request
        .get(this.config.seafileURL  + '/repos')
        .set('Authorization', 'Token ' + token)
        .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        .set('Accept', 'application/json');
      const repos: any[] = JSON.parse(response.text);
      for (const repo of repos) {
        if (repo.name === this.config.seafileRepoName)
        {
          logger.info('Repository found');
          return repo;
        }
      }
      logger.error('Repo not found, check the repo name in configuration.');
      return null;
    }
    catch (e) {
      logger.error('Error getting repo list seafile: ' + e);
      return null;
    }
  }

  // Once you have a repo, you need an upload link to that repo
  async getUploadLink(token: string, repo: any): Promise<string> {
    try{
      const response = await request
        .get(this.config.seafileURL  + '/repos/' + repo.id + '/upload-link')
        .set('Authorization', 'Token ' + token)
        .set('Accept', 'application/json');
      logger.info('Upload link retrieved: ' + JSON.parse(response.text));
      return JSON.parse(response.text);
    }
    catch (e) {
      logger.error('Error getting upload link for repository from seafile server: ' + e);
      return null;
    }
  }
}