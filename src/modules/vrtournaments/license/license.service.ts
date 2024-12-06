import { Injectable } from '@nestjs/common';
import { getLogger } from 'log4js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { License, LicenseDTO } from './license.entity';
import { WorkBook, writeFile, utils, WorkSheet } from 'xlsx';
import { TennisAssociationService } from '../../tennis_association/tennis_association.service';

const logger = getLogger('licenseService');

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License) private readonly repository: Repository<License>,
    private tennisAssociationServeice: TennisAssociationService,
  ) {}

  async findAll(): Promise<License[]> {
    return await this.repository.find();
  }

  async findByName(licenseName: string): Promise<License> {
    return await this.repository.findOne({
      where: {
        licenseName,
      },
    });
  }

  // When a license is initially encountered in as the organization
  // name when loading a tournament, the province of that license
  // is not known and is set to "TBD"
  // This query just fetches those licenses
  async findLicensesWithMissingProvince(): Promise<License[]> {
    return await this.repository.find({
      where: {
        province: 'TBD',
      },
    });
  }

  async setTennisAssociationForLicenses(licenses: LicenseDTO[]): Promise<any> {
    for (const license of licenses) {
      await this.setTennisAssociationForLicense(license);
    }
  }

  async setTennisAssociationForLicense(
    license: LicenseDTO,
  ): Promise<License | null> {
    if (!license.licenseName) {
      logger.warn(`Cant set license pta. No license name supplied.`);
      return null;
    }
    if (!license.province) {
      logger.warn(
        `Cant set license pta for ${license.licenseName}. No PTA supplied.`,
      );
      return null;
    }
    const validPTA = await this.tennisAssociationServeice.validRegionAbbrv(
      license.province,
    );
    if (!validPTA) {
      logger.warn(
        `Cant set license pta for ${license.licenseName}. Invalid PTA: ${license.province}.`,
      );
      return null;
    }
    const l = await this.findByName(license.licenseName);
    if (!l) {
      logger.warn(
        `Cant set license pta for ${license.licenseName}. No unknown license name.`,
      );
      return null;
    }
    l.province = license.province;
    return this.repository.save(l);
  }

  async lookupOrCreate(licenseName: string): Promise<License> {
    let l: License = await this.repository.findOne({
      where: {
        licenseName,
      },
    });
    if (l == null) {
      logger.warn(
        'Found a new license: ' +
          licenseName +
          '. Make sure you fill in the province for it.',
      );
      l = new License(licenseName, 'TBD');
      await this.repository.save(l);
    }
    return l;
  }

  // For every license return both the number of tournaments under the licenses
  // and the end date of the most recent tournament that used the license.
  async getLicenseUsageReport(): Promise<string> {
    logger.info('Creating license usage report.');
    const licenses = await this.repository
      .createQueryBuilder('license')
      .select('license.licenseName', 'licenseName')
      .addSelect('license.province', 'province')
      .addSelect('COUNT(tournament.tournamentCode)', 'tournamentCount')
      .addSelect('MAX(tournament.endDate)', 'mostRecent')
      .addSelect('SUM(CASE WHEN YEAR(tournament.endDate) = 2024 THEN 1 ELSE 0 END)', 'tournamentCount2024')
      .leftJoin('license.tournaments', 'tournament')
      .where('license.licenseName IS NOT NULL')
      .groupBy('license.licenseName')
      .getRawMany();

    const wb: WorkBook = utils.book_new();
    const now: Date = new Date();
    wb.Props = {
      Title: 'Tennis Canada VR License Usage',
    };
    wb.SheetNames.push('Licenses');
    const ws: WorkSheet = utils.json_to_sheet(licenses);
    ws['!cols'] = [{ width: 50 }, { width: 13 }, { width: 11 }, { width: 14 },{ width: 19 }];
    wb.Sheets.Licenses = ws;
    const filename =
      'Reports/VR_License_Usage_' + now.toISOString().slice(0, 10) + '.xlsx';

    writeFile(wb, filename);
    return filename;
  }
}
