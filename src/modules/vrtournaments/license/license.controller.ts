import {Body, Controller, Get, HttpStatus, Param, Post, Res, UseGuards} from '@nestjs/common';
import { LicenseService } from './license.service';
import { License, LicenseDTO } from './license.entity';
import {JwtAuthGuard} from '../../../guards/jwt-auth.guard';

@Controller('License')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  // @UseGuards(JwtAuthGuard)
  async findAll(): Promise<License[]> {
    return await this.licenseService.findAll();
  }

  @Get('missingProvince')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async findOne(@Param() params): Promise<License> {
    return await this.licenseService.findOne(params.licenseName);
  }

  @Post('setTennisAssociationForLicenses')
  @UseGuards(JwtAuthGuard)
  async setTennisAssociationForLicenses(@Body() licenses: LicenseDTO[]): Promise<License[]> {
    return await this.licenseService.setTennisAssociationForLicenses(licenses);
  }

  @Post('setTennisAssociationForLicense')
  @UseGuards(JwtAuthGuard)
  async setTennisAssociationForLicense(@Body() license: LicenseDTO): Promise<License | null> {
    return await this.licenseService.setTennisAssociationForLicense(license);
  }
}
