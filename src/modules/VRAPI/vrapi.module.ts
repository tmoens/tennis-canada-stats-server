import { Module } from '@nestjs/common';
import { VRAPIService } from './vrapi.service';
import {HttpModule} from "@nestjs/common/http";

@Module({
  providers: [
    VRAPIService
  ],
  imports: [
    HttpModule
  ],
  controllers: [
  ],
  exports:[
    VRAPIService
  ],
})
export class VRAPIModule {}
