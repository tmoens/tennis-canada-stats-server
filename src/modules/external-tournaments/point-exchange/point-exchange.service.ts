import { Injectable } from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {LessThanOrEqual, Repository} from 'typeorm';
import {PointExchange} from './point-exchange.entity';
import {getLogger} from 'log4js';

const logger = getLogger('External Event Service');

@Injectable()
export class PointExchangeService {
  constructor(
    @InjectRepository(PointExchange)
    private readonly repo: Repository<PointExchange>,
  ) {}

  async findAll(): Promise<PointExchange[]> {
    return await this.repo.find();
  }

  async findExchaneRate(year: number, sourceCurrency: string, gender: string, targetCurrency: string): Promise<number> {
    const pe: PointExchange = await this.repo.findOne(
      {
        where: {sourceCurrency, targetCurrency, gender, year: LessThanOrEqual(year)},
        order: {year: 'DESC'},
      });
    return (pe.pointExchangeRate) ? pe.pointExchangeRate : 0;
  }
}
