import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { License } from './license.entity';
import { TennisAssociationModule } from '../../tennis_association/tennis_association.module';

@Module({
  imports: [TypeOrmModule.forFeature([License]), TennisAssociationModule],
  providers: [LicenseService],
  controllers: [LicenseController],
  exports: [LicenseService],
})
export class LicenseModule {}
