import {Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards} from '@nestjs/common';
import { LicenseService } from './license.service';
import { License, LicenseDTO } from './license.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('License')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @UseGuards(AuthGuard('bearer'))
  async findAll(): Promise<License[]> {
    return await this.licenseService.findAll();
  }

  @Get('missingProvince')
  @UseGuards(AuthGuard('bearer'))
  async findLicensesWithMissingProvince(): Promise<License[]> {
    return await this.licenseService.findLicensesWithMissingProvince();
  }

  // For every license, report how many tournaments it has been used for
  // as well as the date of the most recent tournament that used the license.
  // TODO Guard this, but at this point, I do not know how to get the client to
  // properly download the file.  And really, there is no sensitive data served up here.
  @Get('usageReport')
  async getLicenseUsageReport( @Res() response): Promise<any> {
    const filename = await this.licenseService.getLicenseUsageReport();
    response.status(HttpStatus.OK);
    await response.download(filename);
    // TODO Delete file?
    // fs.unlink(filename);
    return true;
  }

  @Get(':licenseName')
  @UseGuards(AuthGuard('bearer'))
  async findOne(@Param() params): Promise<License> {

    return await this.licenseService.findOne(params.licenseName);
  }

  @Post('fixLicensesWithoutProvinces')
  @UseGuards(AuthGuard('bearer'))
  async fixLicensesWithMissingProvinces(@Body() fixedLicenses: LicenseDTO[]): Promise<License[]> {
    return await this.licenseService.fixLicensesWithMissingProvinces(fixedLicenses);
  }
}
