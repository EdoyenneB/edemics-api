// admissions.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantService } from '../tenant/tenant.service';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class AdmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  async saveAdmissionForm(tenantId: string, formData: any) {
    try {
      // Check if the tenant exists
      let tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });

      if (!tenant) {
        console.log('Tenant not found, attempting to create a new tenant...');
        // Create the tenant if it doesn't exist
        tenant = await this.tenantService.createTenant({
          name: 'Dummy Tenant', // Or any other default values
          domain: `${tenantId}.example.com`, // Example domain
          subscription: 'free', // Default subscription
          adminEmail: 'admin@example.com', // Placeholder email
          adminName: 'Admin User', // Placeholder name
          adminPassword: 'dummy-password', // Placeholder password (use hashed password in production)
        });
        console.log('New tenant created:', tenant);
      }

      // Log the form data before creating the admission form
      console.log('Form data to be saved:', formData);

      // Extract the relevant data from the nested object
      const {
        academicYear,
        parentType,
        parentConditional,
        existingParent,
        firstName,
        lastName,
        gender,
        studentFullName,
        enrollmentClass,
        dob,
        previousSchool,
        previousPrincipal,
        previousPhoneNumber,
        houseAddress,
        childAllergies,
        bloodGroup,
        immunizationCertificate,
        birthCertificate,
        expectations,
        siblingNames,
        numberOfSiblings,
        custodyInfo,
        billPayment,
        pickupPersons,
        pickupOthers,
        senAssessment,
        senDetails,
        fatherFields,
        motherFields,
        bothParentsFields,
      } = formData.data;

      // Proceed to create the admission form
      return await this.prisma.admissionForm.create({
        data: {
          tenantId,
          academicYear: academicYear || '',
          parentType: parentType || '',
          parentName: parentConditional?.parentName || existingParent || '', // Handle both new and existing parent cases
          firstName: firstName || '',
          lastName: lastName || '',
          gender: gender || '',
          studentFullName: studentFullName || '',
          enrollmentClass: enrollmentClass || '',
          dob: dob ? new Date(dob) : null,
          previousSchool: previousSchool || '',
          previousPrincipal: previousPrincipal || '',
          previousPhoneNumber: previousPhoneNumber || '',
          houseAddress: houseAddress || '',
          childAllergies: childAllergies || '',
          bloodGroup: bloodGroup || '',
          immunizationCertificate: immunizationCertificate.length > 0 ? JSON.stringify(immunizationCertificate) : null, // Handle arrays appropriately
          birthCertificate: birthCertificate.length > 0 ? JSON.stringify(birthCertificate) : null, // Handle arrays appropriately
          expectations: expectations || '',
          siblingNames: siblingNames || '',
          numberOfSiblings: numberOfSiblings || 0,
          custodyInfo: custodyInfo || '',
          billPayment: billPayment || '',
          pickupPersons: pickupPersons || '',
          passportUpload: pickupOthers?.passportUpload.length > 0 ? JSON.stringify(pickupOthers.passportUpload) : null, // Handle arrays appropriately
          senAssessment: senAssessment || '',
          assessmentReport: senDetails?.assessmentReport.length > 0 ? JSON.stringify(senDetails.assessmentReport) : null, // Handle arrays appropriately
          fatherFirstName: fatherFields?.fatherFirstName || bothParentsFields?.fatherFirstName || '',
          fatherLastName: fatherFields?.fatherLastName || bothParentsFields?.fatherLastName || '',
          motherFirstName: motherFields?.motherFirstName || bothParentsFields?.motherFirstName || '',
          motherLastName: motherFields?.motherLastName || bothParentsFields?.motherLastName || '',
        },
      });
    } catch (error) {
      console.error('Error saving admission form:', error);
      throw new Error('Failed to save admission form');
    }
  }

  // Other methods remain the same...

  // Other methods remain the same...


  
  // Get all admission forms for a tenant (optional)
  async getAdmissionForms(tenantId: string) {
    return this.prisma.admissionForm.findMany({
      where: { tenantId },
    });
  }


  async getAdmissionSettings(tenantId: string) {
    return this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });
  }
  async updateAdmissionSettings(tenantId: string, settings: any) {
    const existingSettings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    return this.prisma.admissionSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...settings,
      },
      update: {
        ...settings,
      },
    });
  }


  async updateEditPermissions(tenantId: string, permissions: Record<string, boolean>) {
    const existingSettings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    const currentPermissions = isObject(existingSettings?.editPermissions)
      ? existingSettings.editPermissions
      : {};

    const updatedSettings = {
      ...currentPermissions,
      ...permissions,
    };

    return this.prisma.admissionSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        editPermissions: updatedSettings,
      },
      update: {
        editPermissions: updatedSettings,
      },
    });
  }

  async updateWidgetPermissions(tenantId: string, permissions: Record<string, boolean>) {
    const existingSettings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    const currentPermissions = isObject(existingSettings?.widgetPermissions)
      ? existingSettings.widgetPermissions
      : {};

    const updatedSettings = {
      ...currentPermissions,
      ...permissions,
    };

    return this.prisma.admissionSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        widgetPermissions: updatedSettings,
      },
      update: {
        widgetPermissions: updatedSettings,
      },
    });
  }

  async updateNameSettings(tenantId: string, settings: { format: string; customFormat?: string }) {
    const existingSettings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    const currentSettings = isObject(existingSettings?.nameSettings)
      ? existingSettings.nameSettings
      : {};

    const updatedSettings = {
      ...currentSettings,
      ...settings,
    };

    return this.prisma.admissionSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        nameSettings: updatedSettings,
      },
      update: {
        nameSettings: updatedSettings,
      },
    });
  }
}