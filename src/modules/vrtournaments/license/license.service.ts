import {Injectable} from '@nestjs/common';
import {getLogger} from "log4js";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {License, LicenseDTO} from "./license.entity";
import {WorkBook, Properties, writeFile, utils, WorkSheet} from 'xlsx';
import {INITIAL_LICENSES} from "./initial_licenses";

const logger = getLogger("licenseService");

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(License) private readonly repository: Repository<License>,
    ) {}

  async findAll(): Promise<License[]> {
    return await this.repository.find();
  }

  async findOne(licenseName: string): Promise<License> {
    return await this.repository.findOne(licenseName);
  }

  // When a license is initially encountered in as the organization
  // name when loading a tournament, the province of that license
  // is not known and is set to "TBD"
  // This query just fetches those licenses
  async findLicensesWithMissingProvince(): Promise<License[]> {
    return await this.repository.find({province: "TBD"});
  }

  async fixLicensesWithMissingProvinces(fixedLicenses: LicenseDTO[]): Promise<any> {

    for (let i = 0; i < fixedLicenses.length; i++) {
      logger.info("Fixing license: " + JSON.stringify(fixedLicenses[i]));
      let l = await this.findOne(fixedLicenses[i].licenseName);
      if (null != l) {
        // TODO Check that this province is valid.
        l.province = fixedLicenses[i].province;
        await this.repository.save(l);

      } else {
        logger.warn("Attempt to fix non-existent license!  LicenseName:" + fixedLicenses[i].licenseName)
      }
    }
  }

  // If there are no licenses in the database
  // Only ever used during development.
  async loadLicenses(): Promise<any> {
    let testLicense:License = await this.repository.findOne();
    if (testLicense == null) {
      logger.info("Lodaing licenses.")
      let l:License;
      for (let i = 0; i < INITIAL_LICENSES.length; i++) {
        l = new License(INITIAL_LICENSES[i].licenseName, INITIAL_LICENSES[i].province);
        this.repository.save(l);
      }
      logger.info("Done lodaing licenses.")
    }
    return true;
  }

  async lookupOrCreate(licenseName:string): Promise<License> {
    let l:License = await this.repository.findOne(licenseName);
    if (l == null) {
      logger.warn("Found a new license: " +
        licenseName + ". Make sure you fill in the province for it.");
      l = new License(licenseName, "TBD");
      await this.repository.save(l);
    }

    return l;
  }

  // For every license return both the number of tournaments under the licenses
  // and the end date of the most recent tournament that used the license.
  async getLicenseUsageReport(): Promise<string> {
    const licenses = await this.repository
      .createQueryBuilder("license")
      .select("license.licenseName", "licenseName")
      .addSelect("license.province", "province")
      .addSelect("COUNT(tournament.tournamentCode)", "tournamentCount")
      .addSelect("MAX(tournament.endDate)", "mostRecent")
      .leftJoin("license.tournaments", "tournament")
      .where("license.licenseName IS NOT NULL" )
      .groupBy("license.licenseName")
      .printSql()
      .getRawMany();

    let wb:WorkBook = utils.book_new();
    let now:Date = new Date();
    wb.Props = {
      Title: "Tennis Canada VR License Usage"
    };
    wb.SheetNames.push("Licenses");
    let ws:WorkSheet = utils.json_to_sheet(licenses);
    ws["!cols"] = [
      {width: 50},
      {width: 13},
      {width: 11},
      {width: 14}
    ];
    wb.Sheets["Licenses"] = ws;
    let filename = "Reports/VR_License_Usage_" + now.toISOString().substr(0,10) + ".xlsx";

    writeFile(wb,filename);
    return filename;
  }
}