// student/student.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private prisma: PrismaService) {}

  async createStudentFromApplication(application: any) {
    console.log('Creating student from application:', application.id);
    
    // Generate admission number
    const admissionNumber = await this.generateAdmissionNumber(application.tenantId);
    console.log('Generated admission number:', admissionNumber);
    
    // Find class and section based on application data
    const classInfo = await this.prisma.class.findFirst({
      where: { 
        name: application.class,
        tenantId: application.tenantId 
      }
    });
    console.log('Class found:', classInfo?.id);

    const sectionInfo = application.section ? await this.prisma.section.findFirst({
      where: { 
        name: application.section,
        classId: classInfo?.id,
        tenantId: application.tenantId 
      }
    }) : null;
    console.log('Section found:', sectionInfo?.id);

    // Create the student record
    const studentData = {
      name: `${application.firstName} ${application.lastName}`.trim(),
      admissionNumber,
      classId: classInfo?.id || null,
      sectionId: sectionInfo?.id || null,
      tenantId: application.tenantId,
    };

    console.log('Creating student with data:', studentData);
    
    const student = await this.prisma.student.create({
      data: studentData,
    });

    console.log('Student created successfully:', student.id);

    // Update the application with the student ID
    await this.prisma.admissionApplication.update({
      where: { id: application.id },
      data: { studentId: student.id },
    });

    console.log('Application updated with student ID');

    // Create parent relationships
    await this.createParentStudentRelationships(application, student.id, application.tenantId);
    console.log('Parent relationships created');

    return student;
  }

  async validateStudentForEnrollment(studentId: string, tenantId: string) {
    console.log('Validating student for enrollment - ID:', studentId, 'Tenant:', tenantId);
    
    const student = await this.prisma.student.findFirst({
      where: { 
        id: studentId, 
        tenantId 
      },
      include: {
        class: true,
        section: true,
        parentStudents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      console.error('Student not found in database');
      throw new NotFoundException(`Student not found with ID: ${studentId} for tenant: ${tenantId}`);
    }

    console.log('Student validated successfully:', student.id);
    return student;
  }

  private async createParentStudentRelationships(application: any, studentId: string, tenantId: string) {
    console.log('Creating parent relationships for student:', studentId);
    
    // Create father relationship if exists
    if (application.fatherName && application.fatherName.trim()) {
      await this.ensureParentStudentRelationship(
        application.fatherName,
        'father',
        application.fatherEmail,
        application.fatherPhone,
        studentId,
        tenantId
      );
    }

    // Create mother relationship if exists
    if (application.motherName && application.motherName.trim()) {
      await this.ensureParentStudentRelationship(
        application.motherName,
        'mother',
        application.motherEmail,
        application.motherPhone,
        studentId,
        tenantId
      );
    }

    // Create guardian relationship if exists
    if (application.guardianName && application.guardianName.trim()) {
      await this.ensureParentStudentRelationship(
        application.guardianName,
        'guardian',
        application.guardianEmail,
        application.guardianPhone,
        studentId,
        tenantId
      );
    }
  }

  private async ensureParentStudentRelationship(
    name: string, 
    type: string, 
    email: string, 
    phone: string, 
    studentId: string, 
    tenantId: string
  ) {
    try {
      // Find or create parent
      let parent = await this.prisma.parent.findFirst({
        where: {
          OR: [
            { email: email || '' },
            { phone: phone || '' }
          ],
          tenantId
        }
      });

      if (!parent) {
        parent = await this.prisma.parent.create({
          data: {
            name,
            type,
            email,
            phone,
            tenantId,
          }
        });
      }

      // Create ParentStudent relationship if it doesn't exist
      const existingRelationship = await this.prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: {
            parentId: parent.id,
            studentId: studentId
          }
        }
      });

      if (!existingRelationship) {
        await this.prisma.parentStudent.create({
          data: {
            parentId: parent.id,
            studentId: studentId,
            tenantId,
          }
        });
      }
    } catch (error) {
      console.error('Error creating parent relationship:', error);
    }
  }

  private async generateAdmissionNumber(tenantId: string): Promise<string> {
    const latestStudent = await this.prisma.student.findFirst({
      where: { tenantId },
      orderBy: { admissionNumber: 'desc' },
    });

    if (!latestStudent) {
      return 'STU-001';
    }

    const matches = latestStudent.admissionNumber.match(/\d+/);
    if (matches) {
      const currentNum = parseInt(matches[0]);
      const nextNum = currentNum + 1;
      return `STU-${nextNum.toString().padStart(3, '0')}`;
    }

    return `STU-${Date.now().toString().slice(-6)}`;
  }
   async getStudentWithParents(studentId: string) {
    return this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
        section: true,
        parentStudents: {
          include: {
            parent: true,
          },
        },
      },
    });
  }
}