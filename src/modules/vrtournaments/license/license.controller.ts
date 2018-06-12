import {Body, Controller, Get, HttpStatus, Param, Post, Req, Res} from '@nestjs/common';
import { LicenseService } from './license.service';
import {License, LicenseDTO, VRLicenseUseDTO} from './license.entity';

@Controller('License')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get('missingProvince')
  async findLicensesWithMissingProvince(): Promise<License[]> {
    return await this.licenseService.findLicensesWithMissingProvince();
  }

  // For every license, report how many tournaments it has been used for
  // as well as the date of the most recent tournament that used the license.
  @Get('usageReport')
  async getLicenseUsageReport( @Res() response): Promise<any> {
    let filename = await this.licenseService.getLicenseUsageReport();
    console.log(filename);
    response.status(HttpStatus.OK);
    await response.download(filename);
    //TODO Delete file?
    // fs.unlink(filename);
    return true;
  }

  @Get(':licenseName')
  async findOne(@Param() params): Promise<License> {
    return await this.licenseService.findOne(params.licenseName);
  }

  @Get()
  async findAll(): Promise<License[]> {
    return await this.licenseService.findAll();
  }

  @Post('fixLicensesWithoutProvinces')
  async fixLicensesWithMissingProvinces(@Body() fixedLicenses: LicenseDTO[]): Promise<License[]> {
    return await this.licenseService.fixLicensesWithMissingProvinces(fixedLicenses);
  }

}
