// extracurricular/extracurricular.controller.ts
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
  Request
} from '@nestjs/common';
import { ExtracurricularService } from './extracurricular.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('extracurricular')
@UseGuards(AuthGuard('jwt'))
export class ExtracurricularController {
  constructor(private readonly extracurricularService: ExtracurricularService) {}

  // Clubs
  @Get('clubs')
  async getClubs(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getClubs(req.user.tenantId, filters);
  }

  @Get('clubs/:id')
  async getClub(@Request() req, @Param('id') id: string) {
    return this.extracurricularService.getClub(req.user.tenantId, id);
  }

  @Post('clubs')
  async createClub(@Request() req, @Body() data: any) {
    return this.extracurricularService.createClub(req.user.tenantId, data);
  }

  @Put('clubs/:id')
  async updateClub(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.extracurricularService.updateClub(req.user.tenantId, id, data);
  }

  @Delete('clubs/:id')
  async deleteClub(@Request() req, @Param('id') id: string) {
    return this.extracurricularService.deleteClub(req.user.tenantId, id);
  }

  // Enrollments
  @Get('enrollments')
  async getEnrollments(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getEnrollments(req.user.tenantId, filters);
  }

  @Post('enrollments')
  async enrollStudent(@Request() req, @Body() data: any) {
    return this.extracurricularService.enrollStudent(req.user.tenantId, data);
  }

  @Put('enrollments/:id/status')
  async updateEnrollmentStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.extracurricularService.updateEnrollmentStatus(req.user.tenantId, id, data.status);
  }

  // Attendance
  @Get('attendance')
  async getAttendanceRecords(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getAttendanceRecords(req.user.tenantId, filters);
  }

  @Post('attendance')
  async recordAttendance(@Request() req, @Body() data: any) {
    return this.extracurricularService.recordAttendance(req.user.tenantId, data);
  }

  @Post('attendance/bulk')
  async bulkRecordAttendance(@Request() req, @Body() data: any) {
    return this.extracurricularService.bulkRecordAttendance(req.user.tenantId, data);
  }

  // Change Requests
  @Get('change-requests')
  async getChangeRequests(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getChangeRequests(req.user.tenantId, filters);
  }

  @Post('change-requests')
  async createChangeRequest(@Request() req, @Body() data: any) {
    return this.extracurricularService.createChangeRequest(req.user.tenantId, data);
  }

  @Put('change-requests/:id/status')
  async updateChangeRequestStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.extracurricularService.updateChangeRequestStatus(req.user.tenantId, id, data.status);
  }

  // Unenrollments
  @Get('unenrollments')
  async getUnenrollments(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getUnenrollments(req.user.tenantId, filters);
  }

  @Post('unenrollments')
  async requestUnenrollment(@Request() req, @Body() data: any) {
    return this.extracurricularService.requestUnenrollment(req.user.tenantId, data);
  }

  @Put('unenrollments/:id/status')
  async updateUnenrollmentStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.extracurricularService.updateUnenrollmentStatus(req.user.tenantId, id, data.status);
  }

  // Vendors
  @Get('vendors')
  async getVendors(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getVendors(req.user.tenantId, filters);
  }

  @Post('vendors')
  async createVendor(@Request() req, @Body() data: any) {
    return this.extracurricularService.createVendor(req.user.tenantId, data);
  }

  // External Staff Management
  @Get('external-staff')
  async getExternalStaff(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getExternalStaff(req.user.tenantId, filters);
  }

  @Get('external-staff/:id')
  async getExternalStaffMember(@Request() req, @Param('id') id: string) {
    return this.extracurricularService.getExternalStaffMember(req.user.tenantId, id);
  }

  @Post('external-staff')
  async createExternalStaff(@Request() req, @Body() data: any) {
    return this.extracurricularService.createExternalStaff(req.user.tenantId, data);
  }

  @Put('external-staff/:id')
  async updateExternalStaff(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.extracurricularService.updateExternalStaff(req.user.tenantId, id, data);
  }

  @Delete('external-staff/:id')
  async deleteExternalStaff(@Request() req, @Param('id') id: string) {
    return this.extracurricularService.deleteExternalStaff(req.user.tenantId, id);
  }

  // Students & Employees
  @Get('students/admitted')
  async getAdmittedStudents(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getAdmittedStudents(req.user.tenantId, filters);
  }

  @Get('employees')
  async getEmployees(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getEmployees(req.user.tenantId, filters);
  }

  // Reports
  @Get('reports/attendance')
  async getAttendanceReports(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getAttendanceReports(req.user.tenantId, filters);
  }

  @Get('reports/financial')
  async getFinancialReports(@Request() req, @Query() filters: any) {
    return this.extracurricularService.getFinancialReports(req.user.tenantId, filters);
  }
}