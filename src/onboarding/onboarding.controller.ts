import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,

} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(AuthGuard('jwt'))
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get()
  async getOnboardingData(@Request() req) {
    return this.onboardingService.getAllOnboardingData(req.user.tenantId);
  }

  @Post('school-details')
  async saveSchoolDetails(@Request() req, @Body() data: any) {
    return this.onboardingService.saveSchoolDetails(req.user.tenantId, data);
  }

  @Post('branches')
  async saveBranches(@Request() req, @Body() branches: any[]) {
    return this.onboardingService.saveBranches(req.user.tenantId, branches);
  }

  @Post('organogram')
  async saveOrganogram(@Request() req, @Body() departments: any[]) {
    return this.onboardingService.saveDepartments(req.user.tenantId, departments);
  }

  @Post('employees')
  async saveEmployees(@Request() req, @Body() employees: any[]) {
    return this.onboardingService.saveEmployees(req.user.tenantId, employees);
  }

  @Post('classes')
  async saveClasses(@Request() req, @Body() classes: any[]) {
    return this.onboardingService.saveClasses(req.user.tenantId, classes);
  }

  @Post('subjects')
  async saveSubjects(@Request() req, @Body() subjects: any[]) {
    return this.onboardingService.saveSubjects(req.user.tenantId, subjects);
  }

  @Post('students')
  async saveStudents(@Request() req, @Body() data: { students: any[]; parents: any[] }) {
    return this.onboardingService.saveStudentsAndParents(req.user.tenantId, data);
  }

  @Post('sessions')
  async saveSessions(@Request() req, @Body() sessions: any[]) {
    return this.onboardingService.saveSessions(req.user.tenantId, sessions);
  }

  @Post('notifications')
  async saveNotifications(@Request() req, @Body() data: any) {
    return this.onboardingService.saveNotifications(req.user.tenantId, data);
  }

  @Post('complete')
  async completeOnboarding(@Request() req) {
    return this.onboardingService.completeOnboarding(req.user.tenantId);
  }
}