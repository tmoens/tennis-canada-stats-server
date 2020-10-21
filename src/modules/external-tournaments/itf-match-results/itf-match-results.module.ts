import { Module } from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ItfMatchResult} from './itf-match-result.entity';
import {ItfMatchResultsService} from './itf-match-results.service';
import {ItfMatchResultsController} from './itf-match-results.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ItfMatchResult]),
  ],
  providers: [
    ItfMatchResultsService,
  ],
  controllers: [
    ItfMatchResultsController,
  ],
  exports: [
    TypeOrmModule,
    ItfMatchResultsService,
  ],

})
export class ItfMatchResultsModule {}
