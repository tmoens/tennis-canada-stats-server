import { Module } from '@nestjs/common';
import {HttpModule} from '@nestjs/axios';
import {ExternalapiService} from './externalapi.service';
import {NickNameService} from './nicknameService';

// This module collects a bunch of external API service we use.
@Module({
  providers: [
    ExternalapiService,
    NickNameService,
  ],
  imports: [
    HttpModule,
  ],
  controllers: [
  ],
  exports: [
    ExternalapiService,
    NickNameService,
  ],
})
export class ExternalapiModule {}
