import { Controller, Get, Put, Post, Body, Param } from '@nestjs/common';
import { AdmissionsService } from './admissions.service';

@Controller('admissions') // Base route for all admissions endpoints
export class AdmissionsController {
  constructor(private readonly admissionsService: AdmissionsService) {}

  // Get admission settings for a tenant
  @Get('settings/:tenantId')
  async getAdmissionSettings(@Param('tenantId') tenantId: string) {
    return this.admissionsService.getAdmissionSettings(tenantId);
  }

  // Update edit permissions
  @Put('settings/:tenantId/edit-permissions')
  async updateEditPermissions(
    @Param('tenantId') tenantId: string,
    @Body() body: { permissions: Record<string, boolean> },
  ) {
    return this.admissionsService.updateEditPermissions(tenantId, body.permissions);
  }

  // Update widget permissions
  @Put('settings/:tenantId/widget-permissions')
  async updateWidgetPermissions(
    @Param('tenantId') tenantId: string,
    @Body() body: { permissions: Record<string, boolean> },
  ) {
    return this.admissionsService.updateWidgetPermissions(tenantId, body.permissions);
  }

  // Update name settings
  @Put('settings/:tenantId/name-settings')
  async updateNameSettings(
    @Param('tenantId') tenantId: string,
    @Body() body: { format: string; customFormat?: string },
  ) {
    return this.admissionsService.updateNameSettings(tenantId, body);
  }

  // Update admission settings
  @Put('settings/:tenantId')
  async updateAdmissionSettings(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
  ) {
    return this.admissionsService.updateAdmissionSettings(tenantId, body);
  }

  // Submit admission form
  @Post(':tenantId/submit')
  async submitAdmissionForm(
    @Param('tenantId') tenantId: string,
    @Body() formData: any,
  ) {
    console.log('Received form data:', formData); // Log the received form data
    return this.admissionsService.saveAdmissionForm(tenantId, formData);
  }

  // Get all admission forms for a tenant (optional)
  @Get(':tenantId/forms')
  async getAdmissionForms(@Param('tenantId') tenantId: string) {
    return this.admissionsService.getAdmissionForms(tenantId);
  }
}