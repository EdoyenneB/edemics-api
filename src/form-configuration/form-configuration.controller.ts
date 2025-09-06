// form-configuration/form-configuration.controller.ts
import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FormConfigurationService } from './form-configuration.service';

@Controller('form-configuration')
@UseGuards(AuthGuard('jwt'))
export class FormConfigurationController {
  constructor(private readonly formConfigService: FormConfigurationService) {}

  @Get()
  async getFormConfiguration(@Request() req) {
    const config = await this.formConfigService.getFormConfiguration(req.user.tenantId);
    return { config };
  }

  @Put()
  async updateFormConfiguration(@Request() req, @Body() data: any) {
    const config = await this.formConfigService.updateFormConfiguration(req.user.tenantId, data);
    return { config };
  }

  @Post('reset')
  async resetToDefault(@Request() req) {
    const config = await this.formConfigService.resetToDefault(req.user.tenantId);
    return { config };
  }
}