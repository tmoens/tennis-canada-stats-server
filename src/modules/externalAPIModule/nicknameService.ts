import {Injectable} from '@nestjs/common';
import {ExternalapiService} from './externalapi.service';
import {lastValueFrom} from 'rxjs';

@Injectable()
export class NickNameService {
  // a nickname cache
  nickNames: string[][] = [];

  constructor(
    private readonly externalAPIService: ExternalapiService,
  ) {}

  async isNickName(name1: string, name2: string): Promise<boolean> {
    if (name1 === name2) return Promise.resolve(true);
    let shorter: string;
    let longer: string;
    if (name1.length > name2.length) {
      shorter = name2.toLowerCase();
      longer = name1.toLowerCase();
    } else {
      shorter = name1.toLowerCase();
      longer = name2.toLowerCase();
    }
    const nicknames: string[] = await this.getNicknames(longer);
    if (nicknames && nicknames.indexOf(shorter) > -1) {
      return Promise.resolve(true);
    } else {
      return Promise.resolve(false);
    }
  }

  async getNicknames(name: string): Promise<string[]> {
    // If you get a request for nicknames for a name you have never seen before, go get it
    // and cache it.
    if (!this.nickNames[name]) {
      const temp = [];
      const nicknames = await lastValueFrom(this.externalAPIService.fetchNickNames(name));
      if (nicknames && nicknames.nicknames) {
        for (const nn of nicknames.nicknames) temp.push(nn.nickname.toLowerCase());
      }
      this.nickNames[name] = temp;
    }
    return this.nickNames[name];
  }
}
