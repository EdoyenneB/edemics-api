// school-setup.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolSetupService {
  constructor(private readonly prisma: PrismaService) {}

  // Create or update school setup
  async createOrUpdateSchool(tenantId: string, data: any) {
    return this.prisma.school.upsert({
      where: { tenantId },
      create: { ...data, tenantId },
      update: { ...data },
    });
  }

  // Get school setup by tenant ID
  async getSchoolByTenantId(tenantId: string) {
    return this.prisma.school.findUnique({
      where: { tenantId },
      include: { branches: true, classes: true },
    });
  }

  // Create a new branch
  async createBranch(schoolId: string, data: any) {
    return this.prisma.branch.create({
      data: { ...data, schoolId },
    });
  }

  // Update an existing branch
  async updateBranch(branchId: string, data: any) {
    return this.prisma.branch.update({
      where: { id: branchId },
      data,
    });
  }

  // Delete a branch
  async deleteBranch(branchId: string) {
    return this.prisma.branch.delete({
      where: { id: branchId },
    });
  }

  // Create a new class
  async createClass(schoolId: string, data: any) {
    return this.prisma.class.create({
      data: { ...data, schoolId },
    });
  }

  // Update an existing class
  async updateClass(classId: string, data: any) {
    return this.prisma.class.update({
      where: { id: classId },
      data,
    });
  }

  // Delete a class
  async deleteClass(classId: string) {
    return this.prisma.class.delete({
      where: { id: classId },
    });
  }
}