// admission/admission.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdmissionService {
  constructor(private prisma: PrismaService) {}

  // Application Management
  async getApplications(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.class) where.class = filters.class;
      if (filters.search) {
        where.OR = [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { applicationNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.admissionApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async getApplication(tenantId: string, id: string) {
    const application = await this.prisma.admissionApplication.findFirst({
      where: { id, tenantId },
    }); 

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

 // admission/admission.service.ts
async createApplication(tenantId: string, data: any) {
  // Generate application number
  const settings = await this.getAdmissionSettings(tenantId);
  const nextNum = settings.nextNumber;
  const prefix = settings.documentPrefix;
  const suffix = settings.documentSuffix;
  
  const applicationNumber = settings.referenceType === 'prefix' 
    ? `${prefix}-${nextNum}-${suffix}`
    : `${nextNum}-${suffix}-${prefix}`;

  // Increment next number
  const nextNumber = this.incrementNumber(nextNum);
  await this.prisma.admissionSettings.update({
    where: { tenantId },
    data: { nextNumber },
  });

  return this.prisma.admissionApplication.create({
    data: {
      ...data,
      applicationNumber,
      tenantId,
      status: data.status || "Form Submitted",
      submittedAt: new Date(),
    },
  });
}

 // admission/admission.service.ts (update method)
async updateApplication(tenantId: string, id: string, data: any) {
  const application = await this.getApplication(tenantId, id);
  
  return this.prisma.admissionApplication.update({
    where: { id: application.id },
    data: {
      ...data,
      // Ensure studentId is properly handled
      studentId: data.studentId || application.studentId
    },
  });
}

  async updateApplicationStatus(tenantId: string, id: string, status: string) {
    const application = await this.getApplication(tenantId, id);
    
    return this.prisma.admissionApplication.update({
      where: { id: application.id },
      data: { status },
    });
  }

  async deleteApplication(tenantId: string, id: string) {
    const application = await this.getApplication(tenantId, id);
    
    return this.prisma.admissionApplication.delete({
      where: { id: application.id },
    });
  }

  // Bulk operations
  async bulkUpdateStatus(tenantId: string, ids: string[], status: string) {
    return this.prisma.admissionApplication.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
  }

  async bulkDeleteApplications(tenantId: string, ids: string[]) {
    return this.prisma.admissionApplication.deleteMany({
      where: { id: { in: ids }, tenantId },
    });
  }

  // Admission Settings
  async getAdmissionSettings(tenantId: string) {
    let settings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // Create default settings if they don't exist
      const currentYear = new Date().getFullYear();
      settings = await this.prisma.admissionSettings.create({
        data: {
          tenantId,
          customUrl: `https://school.edu/admissions`,
          documentPrefix: 'ADM',
          documentSuffix: currentYear.toString(),
          nextNumber: '001',
          referenceType: 'prefix',
          ageCriteria: this.getDefaultAgeCriteria(),
          feeConfiguration: this.getDefaultFeeConfiguration(),
          workflow: this.getDefaultWorkflow(),
          admissionPeriods: this.getDefaultAdmissionPeriods(currentYear),
        },
      });
    }

    return settings;
  }

  async updateAdmissionSettings(tenantId: string, data: any) {
    const settings = await this.prisma.admissionSettings.findUnique({
      where: { tenantId },
    });

    if (settings) {
      return this.prisma.admissionSettings.update({
        where: { tenantId },
        data,
      });
    } else {
      return this.prisma.admissionSettings.create({
        data: { ...data, tenantId },
      });
    }
  }

  // Documents
  async getDocuments(tenantId: string, type?: string) {
    const where: any = { tenantId };
    if (type) where.type = type;

    return this.prisma.admissionDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(tenantId: string, data: any) {
    return this.prisma.admissionDocument.create({
      data: { ...data, tenantId },
    });
  }

  async updateDocument(tenantId: string, id: string, data: any) {
    const document = await this.prisma.admissionDocument.findFirst({
      where: { id, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.admissionDocument.update({
      where: { id: document.id },
      data,
    });
  }

  async deleteDocument(tenantId: string, id: string) {
    const document = await this.prisma.admissionDocument.findFirst({
      where: { id, tenantId },
    }); 

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return this.prisma.admissionDocument.delete({
      where: { id: document.id },
    });
  }

  // Helper methods
  private incrementNumber(currentNumber: string): string {
    const num = parseInt(currentNumber, 10);
    const nextNum = num + 1;
    return nextNum.toString().padStart(currentNumber.length, '0');
  }

  private getDefaultAgeCriteria() {
    return [
      { class: "Grade 1", minAge: 5, maxAge: 6 },
      { class: "Grade 2", minAge: 6, maxAge: 7 },
      { class: "Grade 3", minAge: 7, maxAge: 8 },
      { class: "Grade 4", minAge: 8, maxAge: 9 },
      { class: "Grade 5", minAge: 9, maxAge: 10 },
    ];
  }

  private getDefaultFeeConfiguration() {
    return [
      { class: "Grade 1", fee: 1000, currency: "USD", active: true },
      { class: "Grade 2", fee: 1100, currency: "USD", active: true },
      { class: "Grade 3", fee: 1200, currency: "USD", active: true },
      { class: "Grade 4", fee: 1300, currency: "USD", active: true },
      { class: "Grade 5", fee: 1400, currency: "USD", active: true },
    ];
  }

  private getDefaultWorkflow() {
    return [
      {
        id: 1,
        title: "Form Submission",
        status: "Form Submitted",
        emailTitle: "Thank you for your application",
        emailContent: "Dear [Parent_Name],\n\nThank you for submitting an application for [Student_Name]. We have received your application and it is currently being processed.\n\nYou will be notified once your application moves to the next stage.\n\nBest regards,\nAdmissions Team",
        attachments: [],
        docType: "admission_form",
        fieldTags: ["Parent_Name", "Student_Name", "Application_Date"],
      },
      {
        id: 2,
        title: "Assessment",
        status: "Under Assessment",
        emailTitle: "Assessment Scheduled",
        emailContent: "Dear [Parent_Name],\n\nWe are pleased to inform you that [Student_Name]'s application has moved to the assessment stage.\n\nPlease bring your child to the school on [Assessment_Date] at [Assessment_Time] for the assessment.\n\nBest regards,\nAdmissions Team",
        attachments: ["Assessment_Guidelines.pdf"],
        docType: "assessment",
        fieldTags: ["Parent_Name", "Student_Name", "Assessment_Date", "Assessment_Time"],
      },
      {
        id: 3,
        title: "Admission Letter",
        status: "Admission Letter Sent",
        emailTitle: "Admission Offer",
        emailContent: "Dear [Parent_Name],\n\nWe are pleased to inform you that [Student_Name] has been offered admission to [Class_Name] for the [Academic_Year] academic year.\n\nPlease find attached the admission letter and payment instructions.\n\nBest regards,\nAdmissions Team",
        attachments: ["Admission_Letter.pdf", "Payment_Instructions.pdf"],
        docType: "admission_letter",
        fieldTags: ["Parent_Name", "Student_Name", "Class_Name", "Academic_Year", "Fee_Amount"],
      },
      {
        id: 4,
        title: "Payment",
        status: "Awaiting Payment",
        emailTitle: "Payment Reminder",
        emailContent: "Dear [Parent_Name],\n\nThis is a reminder that payment for [Student_Name]'s admission is due by [Payment_Deadline].\n\nPlease make the payment to secure your child's place.\n\nBest regards,\nAdmissions Team",
        attachments: ["Payment_Instructions.pdf"],
        docType: "payment",
        fieldTags: ["Parent_Name", "Student_Name", "Payment_Deadline", "Fee_Amount"],
      },
      {
        id: 5,
        title: "Admission",
        status: "Admitted",
        emailTitle: "Welcome to Our School",
        emailContent: "Dear [Parent_Name],\n\nWe are delighted to welcome [Student_Name] to our school community. Your child has been successfully admitted to [Class_Name] for the [Academic_Year] academic year.\n\nPlease find attached important information about the orientation day and school calendar.\n\nBest regards,\nAdmissions Team",
        attachments: ["Orientation_Guide.pdf", "School_Calendar.pdf"],
        docType: "welcome",
        fieldTags: ["Parent_Name", "Student_Name", "Class_Name", "Academic_Year", "Orientation_Date"],
      },
    ];
  }
  

  private getDefaultAdmissionPeriods(currentYear: number) {
    return [
      {
        id: 1,
        year: `${currentYear}-${currentYear + 1}`,
        startDate: new Date(currentYear, 8, 1), // September 1
        endDate: new Date(currentYear + 1, 7, 31), // August 31
        deadline: new Date(currentYear, 6, 31), // July 31
        message: "Admission for this academic year is now closed. Please check back for the next academic year.",
      },
      {
        id: 2,
        year: `${currentYear + 1}-${currentYear + 2}`,
        startDate: new Date(currentYear + 1, 8, 1),
        endDate: new Date(currentYear + 2, 7, 31),
        deadline: new Date(currentYear + 1, 6, 31),
        message: "Admission for this academic year is now closed. Please check back for the next academic year.",
      },
    ];
  }

  // admission/admission.service.ts (add these methods)
async createApplicationFromForm(tenantId: string, formData: any) {
  const settings = await this.getAdmissionSettings(tenantId);
  const nextNum = settings.nextNumber;
  const prefix = settings.documentPrefix;
  const suffix = settings.documentSuffix;
  
  const applicationNumber = settings.referenceType === 'prefix' 
    ? `${prefix}-${nextNum}-${suffix}`
    : `${nextNum}-${suffix}-${prefix}`;

  // Increment next number
  const nextNumber = this.incrementNumber(nextNum);
  await this.prisma.admissionSettings.update({
    where: { tenantId },
    data: { nextNumber },
  });

  // Transform form data to match application schema
  const applicationData = this.transformFormDataToApplication(formData, applicationNumber);

  return this.prisma.admissionApplication.create({
    data: {
      ...applicationData,
      tenantId,
    },
  });
}

private transformFormDataToApplication(formData: any, applicationNumber: string) {
  return {
    applicationNumber,
    status: "Form Submitted",
    submittedAt: new Date(),
    
    // Student Information
    firstName: formData.firstName,
    lastName: formData.lastName,
    middleName: formData.middleName,
    dateOfBirth: new Date(formData.dateOfBirth),
    gender: formData.gender,
    religion: formData.religion,
    nationality: formData.nationality,
    homeLanguage: formData.homeLanguage,
    disability: formData.disability,
    specialNeeds: formData.specialNeeds,
    previousSchool: formData.previousSchool,
    bloodGroup: formData.bloodGroup,
    genotype: formData.genotype,
    knownAllergies: formData.knownAllergies,
    chronicConditions: formData.chronicConditions,
    immunizationStatus: formData.immunizationStatus,
    
    // Address Information
    address: formData.address,
    city: formData.city,
    state: formData.state,
    country: formData.country,
    postalCode: formData.postalCode,
    lga: formData.lga,
    stateOfOrigin: formData.stateOfOrigin,
    
    // Class Information
    class: formData.class,
    section: formData.section,
    yearOfAdmission: formData.yearOfAdmission,
    
    // Parent/Guardian Information
    fatherName: formData.fatherName,
    fatherEmail: formData.fatherEmail,
    fatherPhone: formData.fatherPhone,
    fatherOccupation: formData.fatherOccupation,
    fatherEducation: formData.fatherEducation,
    fatherCompany: formData.fatherCompany,
    fatherOfficeAddress: formData.fatherOfficeAddress,
    
    motherName: formData.motherName,
    motherEmail: formData.motherEmail,
    motherPhone: formData.motherPhone,
    motherOccupation: formData.motherOccupation,
    motherEducation: formData.motherEducation,
    motherCompany: formData.motherCompany,
    motherOfficeAddress: formData.motherOfficeAddress,
    
    guardianName: formData.guardianName,
    guardianEmail: formData.guardianEmail,
    guardianPhone: formData.guardianPhone,
    guardianRelationship: formData.guardianRelationship,
    guardianAddress: formData.guardianAddress,
    guardianOccupation: formData.guardianOccupation,
    
    emergencyName: formData.emergencyName,
    emergencyRelationship: formData.emergencyRelationship,
    emergencyPhone: formData.emergencyPhone,
    emergencyPhone2: formData.emergencyPhone2,
    
    // Documents
    birthCertificate: formData.birthCertificate,
    immunizationRecords: formData.immunizationRecords,
    previousSchoolReport: formData.previousSchoolReport,
    medicalReport: formData.medicalReport,
    parentIdProof: formData.parentIdProof,
    otherDocuments: formData.otherDocuments,
  };
}
}