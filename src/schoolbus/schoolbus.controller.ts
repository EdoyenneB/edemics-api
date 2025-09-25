// schoolbus/schoolbus.controller.ts
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
import { SchoolBusService } from './schoolbus.service';

@Controller('schoolbus')
@UseGuards(AuthGuard('jwt'))
export class SchoolBusController {
  constructor(private readonly schoolBusService: SchoolBusService) {}

  // ---------------- Buses ----------------
  @Get('buses')
  async getBuses(@Request() req, @Query() query: any) {
    return this.schoolBusService.getBuses(req.user.tenantId, query);
  }

  @Get('buses/:id')
  async getBus(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.getBus(req.user.tenantId, id);
  }

  @Post('buses')
  async createBus(@Request() req, @Body() data: any) {
    return this.schoolBusService.createBus(req.user.tenantId, data);
  }

  @Put('buses/:id')
  async updateBus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateBus(req.user.tenantId, id, data);
  }

  @Delete('buses/:id')
  async deleteBus(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.deleteBus(req.user.tenantId, id);
  }

  // ---------------- Routes ----------------
  @Get('routes')
  async getRoutes(@Request() req, @Query() query: any) {
    return this.schoolBusService.getRoutes(req.user.tenantId, query);
  }

  @Get('routes/:id')
  async getRoute(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.getRoute(req.user.tenantId, id);
  }

  @Post('routes')
  async createRoute(@Request() req, @Body() data: any) {
    return this.schoolBusService.createRoute(req.user.tenantId, data);
  }

  @Put('routes/:id')
  async updateRoute(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateRoute(req.user.tenantId, id, data);
  }

  @Delete('routes/:id')
  async deleteRoute(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.deleteRoute(req.user.tenantId, id);
  }

  // ---------------- Staff ----------------
  @Get('staff')
  async getStaff(@Request() req, @Query() query: any) {
    return this.schoolBusService.getStaff(req.user.tenantId, query);
  }

  @Get('staff/:id')
  async getStaffMember(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.getStaffMember(req.user.tenantId, id);
  }

  @Post('staff')
  async createStaff(@Request() req, @Body() data: any) {
    return this.schoolBusService.createStaff(req.user.tenantId, data);
  }

  @Put('staff/:id')
  async updateStaff(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateStaff(req.user.tenantId, id, data);
  }

  @Delete('staff/:id')
  async deleteStaff(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.deleteStaff(req.user.tenantId, id);
  }

  // ---------------- Assignments ----------------
  @Get('assignments')
  async getStudentAssignments(@Request() req, @Query() query: any) {
    return this.schoolBusService.getStudentAssignments(req.user.tenantId, query);
  }

  @Post('assignments')
  async assignStudentToBus(@Request() req, @Body() data: any) {
    return this.schoolBusService.assignStudentToBus(req.user.tenantId, data);
  }

  @Put('assignments/:id')
  async updateStudentAssignment(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateStudentAssignment(req.user.tenantId, id, data);
  }

  @Delete('assignments/:id')
  async removeStudentFromBus(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.removeStudentFromBus(req.user.tenantId, id);
  }

  // ---------------- Analytics ----------------
  @Get('analytics')
  async getBusAnalytics(@Request() req) {
    return this.schoolBusService.getBusAnalytics(req.user.tenantId);
  }

  // ---------------- Helpers ----------------
  @Get('available-drivers')
  async getAvailableDrivers(@Request() req) {
    return this.schoolBusService.getAvailableDrivers(req.user.tenantId);
  }

  @Get('available-administrators')
  async getAvailableAdministrators(@Request() req) {
    return this.schoolBusService.getAvailableAdministrators(req.user.tenantId);
  }

  @Get('active-routes')
  async getActiveRoutes(@Request() req) {
    return this.schoolBusService.getActiveRoutes(req.user.tenantId);
  }

  @Get('employees')
  async getEmployeesForStaff(@Request() req) {
    return this.schoolBusService.getEmployeesForStaff(req.user.tenantId);
  }

  // ---------------- Enrollments ----------------
  @Get('enrollments')
  async getEnrollments(@Request() req, @Query() query: any) {
    return this.schoolBusService.getEnrollments(req.user.tenantId, query);
  }

  @Get('enrollments/:id')
  async getEnrollment(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.getEnrollment(req.user.tenantId, id);
  }

  @Post('enrollments')
  async createEnrollment(@Request() req, @Body() data: any) {
    return this.schoolBusService.createEnrollment(req.user.tenantId, data);
  }

  @Put('enrollments/:id')
  async updateEnrollment(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateEnrollment(req.user.tenantId, id, data);
  }

  @Delete('enrollments/:id')
  async deleteEnrollment(@Request() req, @Param('id') id: string) {
    return this.schoolBusService.deleteEnrollment(req.user.tenantId, id);
  }

  @Put('enrollments/:id/status')
  async updateEnrollmentStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateEnrollmentStatus(req.user.tenantId, id, data.status);
  }

  @Put('enrollments/:id/fee-status')
  async updateFeeStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.schoolBusService.updateFeeStatus(req.user.tenantId, id, data.feeStatus);
  }

  @Post('enrollments/bulk/status')
  async bulkUpdateStatus(@Request() req, @Body() data: any) {
    return this.schoolBusService.bulkUpdateEnrollmentStatus(req.user.tenantId, data.ids, data.status);
  }

  @Post('enrollments/bulk/delete')
  async bulkDeleteEnrollments(@Request() req, @Body() data: any) {
    return this.schoolBusService.bulkDeleteEnrollments(req.user.tenantId, data.ids);
  }
}
