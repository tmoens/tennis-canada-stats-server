import { Module, Global } from '@nestjs/common';
import {ConfigurationService} from "./configuration.service";

@Global()
@Module({
  providers: [
    {
      provide: ConfigurationService,
      useValue: new ConfigurationService(`environment/${process.env.NODE_ENV}.env`),
    },
  ],
  exports: [ConfigurationService],
})
export class ConfigurationModule {}