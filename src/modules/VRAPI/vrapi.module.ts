import { Module } from '@nestjs/common';
import { VRAPIService } from './vrapi.service';
import {HttpModule} from '@nestjs/axios';

@Module({
  providers: [
    VRAPIService,
  ],
  imports: [
    HttpModule,
  ],
  controllers: [
  ],
  exports: [
    VRAPIService,
  ],
})
export class VRAPIModule {}
