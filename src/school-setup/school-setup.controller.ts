// school-setup.controller.ts
import { Body, Controller, Get, Param, Post, Put, Delete } from '@nestjs/common';
import { SchoolSetupService } from './school-setup.service';

@Controller('school-setup')
export class SchoolSetupController {
  constructor(private readonly schoolSetupService: SchoolSetupService) {}

  // Create or update school setup
  @Post(':tenantId')
  async createOrUpdateSchool(@Param('tenantId') tenantId: string, @Body() body: any) {
    return this.schoolSetupService.createOrUpdateSchool(tenantId, body);
  }

  // Get school setup by tenant ID
  @Get(':tenantId')
  async getSchoolByTenantId(@Param('tenantId') tenantId: string) {
    return this.schoolSetupService.getSchoolByTenantId(tenantId);
  }

  // Create a new branch
  @Post('branches/:schoolId')
  async createBranch(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.schoolSetupService.createBranch(schoolId, body);
  }

  // Update an existing branch
  @Put('branches/:branchId')
  async updateBranch(@Param('branchId') branchId: string, @Body() body: any) {
    return this.schoolSetupService.updateBranch(branchId, body);
  }

  // Delete a branch
  @Delete('branches/:branchId')
  async deleteBranch(@Param('branchId') branchId: string) {
    return this.schoolSetupService.deleteBranch(branchId);
  }

  // Create a new class
  @Post('classes/:schoolId')
  async createClass(@Param('schoolId') schoolId: string, @Body() body: any) {
    return this.schoolSetupService.createClass(schoolId, body);
  }

  // Update an existing class
  @Put('classes/:classId')
  async updateClass(@Param('classId') classId: string, @Body() body: any) {
    return this.schoolSetupService.updateClass(classId, body);
  }

  // Delete a class
  @Delete('classes/:classId')
  async deleteClass(@Param('classId') classId: string) {
    return this.schoolSetupService.deleteClass(classId);
  }
}