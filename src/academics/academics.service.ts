import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  // Fetch specific settings for a tenant
  async getAcademicSetting(tenantId: string, settingKey: string) {
    const settings = await this.prisma.academicSettings.findUnique({
      where: { tenantId },
    });
    return settings?.settings[settingKey] || null;
  }

  // Update a specific setting
  async updateAcademicSetting(tenantId: string, settingKey: string, value: any) {
    const existingSettings = await this.prisma.academicSettings.findUnique({
      where: { tenantId },
    });
  
    const currentSettings = (existingSettings?.settings || {}) as Record<string, any>;
  
    const updatedSettings = {
      ...currentSettings, // Spread only works if this is treated as an object
      [settingKey]: value,
    };
  
    return this.prisma.academicSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        settings: updatedSettings,
      },
      update: {
        settings: updatedSettings,
      },
    });
  }}