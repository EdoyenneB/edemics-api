import { Controller, Get, Param, Put, Body } from '@nestjs/common';
import { AcademicsService } from './academics.service';

@Controller('academics/settings')
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  @Get(':tenantId/:settingKey')
  async getAcademicSetting(
    @Param('tenantId') tenantId: string,
    @Param('settingKey') settingKey: string,
  ) {
    return this.academicsService.getAcademicSetting(tenantId, settingKey);
  }

  @Put(':tenantId/:settingKey')
  async updateAcademicSetting(
    @Param('tenantId') tenantId: string,
    @Param('settingKey') settingKey: string,
    @Body() body: { value: any },
  ) {
    return this.academicsService.updateAcademicSetting(tenantId, settingKey, body.value);
  }
}
