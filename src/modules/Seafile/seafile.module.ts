import { Module } from '@nestjs/common';
import { SeafileService } from './seafile.service';
import {HttpModule} from '@nestjs/common/http';

@Module({
  providers: [
    SeafileService,
  ],
  imports: [
    HttpModule,
  ],
  controllers: [
  ],
  exports: [
    SeafileService,
  ],
})
export class SeafileModule {}
