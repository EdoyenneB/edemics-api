import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { PrismaService } from '../prisma/prisma.service'; // Import PrismaService
import { TenantModule } from '../tenant/tenant.module'; // Import TenantModule


@Module({
  imports: [TenantModule], // Import the module containing TenantService

  controllers: [AdmissionsController], // Register the controller
  providers: [AdmissionsService, PrismaService], // Register the service and PrismaService
})
export class AdmissionsModule {}