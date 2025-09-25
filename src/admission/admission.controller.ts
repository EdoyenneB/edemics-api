// admission/admission.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdmissionService } from './admission.service';

@Controller('admission')
@UseGuards(AuthGuard('jwt'))
export class AdmissionController {
  constructor(private readonly admissionService: AdmissionService) {}

  // Applications
  @Get('applications')
  async getApplications(@Request() req, @Query() query: any) {
    return this.admissionService.getApplications(req.user.tenantId, query);
  }

  @Get('applications/:id')
  async getApplication(@Request() req, @Param('id') id: string) {
    return this.admissionService.getApplication(req.user.tenantId, id);
  }

  @Post('applications')
  async createApplication(@Request() req, @Body() data: any) {
    return this.admissionService.createApplication(req.user.tenantId, data);
  }

  @Put('applications/:id')
  async updateApplication(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.admissionService.updateApplication(req.user.tenantId, id, data);
  }

  @Put('applications/:id/status')
  async updateApplicationStatus(@Request() req, @Param('id') id: string, @Body() data: { status: string }) {
    return this.admissionService.updateApplicationStatus(req.user.tenantId, id, data.status);
  }

  @Delete('applications/:id')
  async deleteApplication(@Request() req, @Param('id') id: string) {
    return this.admissionService.deleteApplication(req.user.tenantId, id);
  }

  @Post('applications/bulk/status')
  async bulkUpdateStatus(@Request() req, @Body() data: { ids: string[]; status: string }) {
    return this.admissionService.bulkUpdateStatus(req.user.tenantId, data.ids, data.status);
  }

  @Post('applications/bulk/delete')
  async bulkDeleteApplications(@Request() req, @Body() data: { ids: string[] }) {
    return this.admissionService.bulkDeleteApplications(req.user.tenantId, data.ids);
  }

  // Settings
  @Get('settings')
  async getAdmissionSettings(@Request() req) {
    return this.admissionService.getAdmissionSettings(req.user.tenantId);
  }

  @Put('settings')
  async updateAdmissionSettings(@Request() req, @Body() data: any) {
    return this.admissionService.updateAdmissionSettings(req.user.tenantId, data);
  }

  // Documents
  @Get('documents')
  async getDocuments(@Request() req, @Query('type') type: string) {
    return this.admissionService.getDocuments(req.user.tenantId, type);
  }

  @Post('documents')
  async createDocument(@Request() req, @Body() data: any) {
    return this.admissionService.createDocument(req.user.tenantId, data);
  }

  @Put('documents/:id')
  async updateDocument(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.admissionService.updateDocument(req.user.tenantId, id, data);
  }

  @Delete('documents/:id')
  async deleteDocument(@Request() req, @Param('id') id: string) {
    return this.admissionService.deleteDocument(req.user.tenantId, id);
  }

  // admission/admission.controller.ts (add this method)
@Put('applications/:id/student-id')
async updateStudentId(
  @Request() req, 
  @Param('id') id: string, 
  @Body() data: { studentId: string }
) {
  return this.admissionService.updateApplication(req.user.tenantId, id, {
    studentId: data.studentId
  });
}

// admission/admission.controller.ts (add this method)
@Post('applications/form')
async createApplicationFromForm(@Request() req, @Body() formData: any) {
  return this.admissionService.createApplicationFromForm(req.user.tenantId, formData);
}

}