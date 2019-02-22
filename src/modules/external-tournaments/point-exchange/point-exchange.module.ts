import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointExchangeController } from './point-exchange.controller';
import {PointExchangeService} from './point-exchange.service';
import {PointExchange} from './point-exchange.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PointExchange]),
  ],
  providers: [
    PointExchangeService,
  ],
  controllers: [
    PointExchangeController,
  ],
  exports: [
    PointExchangeService,
  ],
})

export class PointExchangeModule {}
