// form-configuration/form-configuration.module.ts
import { Module } from '@nestjs/common';
import { FormConfigurationService } from './form-configuration.service';
import { FormConfigurationController } from './form-configuration.controller';

@Module({
  providers: [FormConfigurationService],
  controllers: [FormConfigurationController],
  exports: [FormConfigurationService],
})
export class FormConfigurationModule {}