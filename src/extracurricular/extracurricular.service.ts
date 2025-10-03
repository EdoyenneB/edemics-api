// extracurricular/extracurricular.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ClubStatus, 
  EnrollmentStatus, 
  AttendanceStatus, 
  ChangeRequestStatus, 
  UnenrollmentStatus,
  ClubType,
  CoordinatorType 
} from '@prisma/client';

@Injectable()
export class ExtracurricularService {
  constructor(private prisma: PrismaService) {}

  // Clubs
  async getClubs(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const clubs = await this.prisma.club.findMany({
      where,
      include: {
        variants: true,
        schedules: true,
        eligibility: true,
        enrollments: {
          where: { status: 'ACTIVE' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clubs.map(club => ({
      ...club,
      enrollmentsCount: club.enrollments.length,
    }));
  }

  async getClub(tenantId: string, id: string) {
    const club = await this.prisma.club.findFirst({
      where: { id, tenantId },
      include: {
        variants: true,
        schedules: true,
        eligibility: true,
        enrollments: {
          include: {
            student: true,
            variant: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException('Club not found');
    }

    return club;
  }

async createClub(tenantId: string, data: any) {
  const { variants, schedules, eligibility, coordinatorId, ...clubData } = data;

  // Use type assertion for enum fields
  const createData: any = {
    ...clubData,
    tenantId: tenantId,
    status: clubData.status as ClubStatus,
    type: clubData.type as ClubType,
    coordinatorType: clubData.coordinatorType as CoordinatorType,
  };

  // Handle coordinator assignment based on coordinatorType
  if (clubData.coordinatorType && coordinatorId) {
    switch (clubData.coordinatorType) {
      case 'EMPLOYEE':
        createData.employeeCoordinatorId = coordinatorId;
        break;
      case 'VENDOR':
        createData.vendorCoordinatorId = coordinatorId;
        break;
      case 'EXTERNAL_STAFF':
        createData.externalStaffCoordinatorId = coordinatorId;
        break;
      default:
        // Handle unknown coordinator type or leave unassigned
        break;
    }
  }

  // Add nested creates if they exist
  if (variants && variants.length > 0) {
    createData.variants = {
      create: variants.map((variant: any) => ({
        name: variant.name,
        amount: variant.amount,
        tenantId: tenantId,
      }))
    };
  }

  if (schedules && schedules.length > 0) {
    createData.schedules = {
      create: schedules.map((schedule: any) => ({
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        tenantId: tenantId,
      }))
    };
  }

  if (eligibility && eligibility.length > 0) {
    createData.eligibility = {
      create: eligibility.map((item: any) => ({
        term: item.term,
        className: item.className,
        tenantId: tenantId,
      }))
    };
  }

  console.log('Creating club with data:', JSON.stringify(createData, null, 2));

  return this.prisma.club.create({
    data: createData,
    include: {
      variants: true,
      schedules: true,
      eligibility: true,
    },
  });
}

async updateClub(tenantId: string, id: string, data: any) {
  const club = await this.getClub(tenantId, id);
  const { variants, schedules, eligibility, coordinatorId, ...clubData } = data;

  // Update club with proper enum types
  const updateData: any = {
    ...clubData,
    status: clubData.status as ClubStatus,
    type: clubData.type as ClubType,
    coordinatorType: clubData.coordinatorType as CoordinatorType,
  };

  // Handle coordinator assignment based on coordinatorType
  if (clubData.coordinatorType && coordinatorId) {
    switch (clubData.coordinatorType) {
      case 'EMPLOYEE':
        updateData.employeeCoordinatorId = coordinatorId;
        updateData.vendorCoordinatorId = null;
        updateData.externalStaffCoordinatorId = null;
        break;
      case 'VENDOR':
        updateData.vendorCoordinatorId = coordinatorId;
        updateData.employeeCoordinatorId = null;
        updateData.externalStaffCoordinatorId = null;
        break;
      case 'EXTERNAL_STAFF':
        updateData.externalStaffCoordinatorId = coordinatorId;
        updateData.employeeCoordinatorId = null;
        updateData.vendorCoordinatorId = null;
        break;
      default:
        updateData.employeeCoordinatorId = null;
        updateData.vendorCoordinatorId = null;
        updateData.externalStaffCoordinatorId = null;
        break;
    }
  }

  const updatedClub = await this.prisma.club.update({
    where: { id: club.id },
    data: updateData,
  });

  // Update variants if provided
  if (variants) {
    await this.prisma.clubVariant.deleteMany({
      where: { clubId: club.id },
    });
    
    if (variants.length > 0) {
      await this.prisma.clubVariant.createMany({
        data: variants.map((v: any) => ({
          name: v.name,
          amount: v.amount,
          clubId: club.id,
          tenantId: tenantId,
        })),
      });
    }
  }

  // Update schedules if provided
  if (schedules) {
    await this.prisma.clubSchedule.deleteMany({
      where: { clubId: club.id },
    });
    
    if (schedules.length > 0) {
      await this.prisma.clubSchedule.createMany({
        data: schedules.map((s: any) => ({
          day: s.day,
          startTime: s.startTime,
          endTime: s.endTime,
          clubId: club.id,
          tenantId: tenantId,
        })),
      });
    }
  }

  // Update eligibility if provided
  if (eligibility) {
    await this.prisma.clubEligibility.deleteMany({
      where: { clubId: club.id },
    });
    
    if (eligibility.length > 0) {
      await this.prisma.clubEligibility.createMany({
        data: eligibility.map((e: any) => ({
          term: e.term,
          className: e.className,
          clubId: club.id,
          tenantId: tenantId,
        })),
      });
    }
  }

  return this.getClub(tenantId, id);
}

  async deleteClub(tenantId: string, id: string) {
    const club = await this.getClub(tenantId, id);

    return this.prisma.club.delete({
      where: { id: club.id },
    });
  }

  // Enrollments
  async getEnrollments(tenantId: string, filters?: any) {
    const where: any = {
      club: { tenantId },
    };

    if (filters) {
      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.clubId) where.clubId = filters.clubId;
      if (filters.term) where.term = filters.term;
      if (filters.status) where.status = filters.status;
    }

    return this.prisma.clubEnrollment.findMany({
      where,
      include: {
        student: true,
        club: true,
        variant: true,
        attendance: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async enrollStudent(tenantId: string, data: any) {
    const { studentId, clubId, variantId, term } = data;

    // Check if student exists and is admitted
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if club exists
    const club = await this.getClub(tenantId, clubId);

    // Calculate amount
    let amount = club.baseAmount;
    if (variantId) {
      const variant = club.variants.find(v => v.id === variantId);
      if (variant) {
        amount += variant.amount;
      }
    }

    // Check for existing enrollment
    const existingEnrollment = await this.prisma.clubEnrollment.findFirst({
      where: {
        studentId,
        clubId,
        term,
        status: 'ACTIVE',
      },
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this club for the selected term');
    }

    // Use type assertion for the data
    const enrollmentData: any = {
      studentId,
      clubId,
      variantId: variantId || null,
      term,
      amount,
      status: 'ACTIVE' as EnrollmentStatus,
      tenantId,
    };

    return this.prisma.clubEnrollment.create({
      data: enrollmentData,
      include: {
        student: true,
        club: true,
        variant: true,
      },
    });
  }

  async updateEnrollmentStatus(tenantId: string, id: string, status: string) {
    const enrollment = await this.prisma.clubEnrollment.findFirst({
      where: { id, club: { tenantId } },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.clubEnrollment.update({
      where: { id: enrollment.id },
      data: { 
        status: status as EnrollmentStatus 
      },
      include: {
        student: true,
        club: true,
        variant: true,
      },
    });
  }

  // Attendance
 

// extracurricular/extracurricular.service.ts

// extracurricular/extracurricular.service.ts

async recordAttendance(tenantId: string, data: any) {
  const { enrollmentId, date, status } = data;

  // Check if enrollment exists and belongs to tenant
  const enrollment = await this.prisma.clubEnrollment.findFirst({
    where: { 
      id: enrollmentId, 
      club: { tenantId },
      status: 'ACTIVE'
    },
    include: {
      student: {
        include: {
          class: true,
          section: true,
        }
      },
      club: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundException('Active enrollment not found');
  }

  // Normalize date to start of day in UTC to avoid timezone issues
  const attendanceDate = new Date(date);
  const normalizedDate = new Date(Date.UTC(
    attendanceDate.getFullYear(),
    attendanceDate.getMonth(),
    attendanceDate.getDate()
  ));

  console.log('Normalized date for attendance:', {
    input: date,
    normalized: normalizedDate.toISOString()
  });

  // Check if attendance already exists for this date
  const existingAttendance = await this.prisma.clubAttendance.findFirst({
    where: {
      enrollmentId,
      date: normalizedDate,
    },
  });

  const attendanceData = {
    enrollmentId,
    date: normalizedDate, // Use normalized date
    status: status as AttendanceStatus,
    clubId: enrollment.clubId,
    tenantId,
  };

  let attendanceRecord;

  if (existingAttendance) {
    // Update existing record
    attendanceRecord = await this.prisma.clubAttendance.update({
      where: { id: existingAttendance.id },
      data: {
        status: status as AttendanceStatus,
      },
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              }
            },
            club: true,
          },
        },
      },
    });
  } else {
    // Create new record
    attendanceRecord = await this.prisma.clubAttendance.create({
      data: attendanceData,
      include: {
        enrollment: {
          include: {
            student: {
              include: {
                class: true,
                section: true,
              }
            },
            club: true,
          },
        },
      },
    });
  }

  return attendanceRecord;
}

// Also update getAttendanceRecords to use the same date normalization
async getAttendanceRecords(tenantId: string, filters?: any) {
  const where: any = {
    enrollment: {
      club: { tenantId },
    },
  };

  if (filters) {
    if (filters.date) {
      const date = new Date(filters.date);
      const normalizedDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
      
      const nextDay = new Date(normalizedDate);
      nextDay.setUTCDate(normalizedDate.getUTCDate() + 1);
      
      where.date = {
        gte: normalizedDate,
        lt: nextDay,
      };
    }
    if (filters.clubId) where.enrollment.clubId = filters.clubId;
    if (filters.studentId) where.enrollment.studentId = filters.studentId;
  }

  return this.prisma.clubAttendance.findMany({
    where,
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              class: true,
              section: true,
            }
          },
          club: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  });
}
 async bulkRecordAttendance(tenantId: string, data: any) {
  const { date, records } = data;

  const results = await Promise.all(
    records.map((record: any) =>
      this.recordAttendance(tenantId, {
        enrollmentId: record.enrollmentId,
        date,
        status: record.status,
      }),
    ),
  );

  
  return results;
}

  // Change Requests
  async getChangeRequests(tenantId: string, filters?: any) {
    const where: any = {
      OR: [
        { currentClub: { tenantId } },
        { requestedClub: { tenantId } },
      ],
    };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.studentId) where.studentId = filters.studentId;
    }

    return this.prisma.clubChangeRequest.findMany({
      where,
      include: {
        student: true,
        currentClub: true,
        requestedClub: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async createChangeRequest(tenantId: string, data: any) {
    const { studentId, currentClubId, requestedClubId, reason } = data;

    // Validate clubs belong to tenant
    const currentClub = await this.getClub(tenantId, currentClubId);
    const requestedClub = await this.getClub(tenantId, requestedClubId);

    // Check if student is enrolled in current club
    const currentEnrollment = await this.prisma.clubEnrollment.findFirst({
      where: {
        studentId,
        clubId: currentClubId,
        status: 'ACTIVE',
      },
    });

    if (!currentEnrollment) {
      throw new Error('Student is not enrolled in the current club');
    }

    // Use type assertion for the data
    const changeRequestData: any = {
      studentId,
      currentClubId,
      requestedClubId,
      reason,
      status: 'PENDING' as ChangeRequestStatus,
      tenantId,
    };

    return this.prisma.clubChangeRequest.create({
      data: changeRequestData,
      include: {
        student: true,
        currentClub: true,
        requestedClub: true,
      },
    });
  }

  async updateChangeRequestStatus(tenantId: string, id: string, status: string) {
    const changeRequest = await this.prisma.clubChangeRequest.findFirst({
      where: {
        id,
        OR: [
          { currentClub: { tenantId } },
          { requestedClub: { tenantId } },
        ],
      },
    });

    if (!changeRequest) {
      throw new NotFoundException('Change request not found');
    }

    const updatedRequest = await this.prisma.clubChangeRequest.update({
      where: { id: changeRequest.id },
      data: {
        status: status as ChangeRequestStatus,
        processedAt: status !== 'PENDING' ? new Date() : null,
      },
      include: {
        student: true,
        currentClub: true,
        requestedClub: true,
      },
    });

    // If approved, update the enrollment
    if (status === 'APPROVED') {
      // Deactivate current enrollment
      await this.prisma.clubEnrollment.updateMany({
        where: {
          studentId: changeRequest.studentId,
          clubId: changeRequest.currentClubId,
          status: 'ACTIVE',
        },
        data: { status: 'INACTIVE' as EnrollmentStatus },
      });

      // Create new enrollment
      const requestedClub = await this.getClub(tenantId, changeRequest.requestedClubId);
      
      const newEnrollmentData: any = {
        studentId: changeRequest.studentId,
        clubId: changeRequest.requestedClubId,
        term: updatedRequest.requestedAt.getFullYear().toString(),
        amount: requestedClub.baseAmount,
        status: 'ACTIVE' as EnrollmentStatus,
        tenantId,
      };

      await this.prisma.clubEnrollment.create({
        data: newEnrollmentData,
      });
    }

    return updatedRequest;
  }

  // Unenrollments
  async getUnenrollments(tenantId: string, filters?: any) {
    const where: any = {
      club: { tenantId },
    };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.studentId) where.studentId = filters.studentId;
      if (filters.clubId) where.clubId = filters.clubId;
    }

    return this.prisma.clubUnenrollment.findMany({
      where,
      include: {
        student: true,
        club: true,
      },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async requestUnenrollment(tenantId: string, data: any) {
    const { studentId, clubId, reason } = data;

    // Check if student is enrolled
    const enrollment = await this.prisma.clubEnrollment.findFirst({
      where: {
        studentId,
        clubId,
        status: 'ACTIVE',
        club: { tenantId },
      },
    });

    if (!enrollment) {
      throw new Error('Student is not enrolled in this club');
    }

    // Use type assertion for the data
    const unenrollmentData: any = {
      studentId,
      clubId,
      reason,
      status: 'PENDING' as UnenrollmentStatus,
      tenantId,
    };

    return this.prisma.clubUnenrollment.create({
      data: unenrollmentData,
      include: {
        student: true,
        club: true,
      },
    });
  }

  async updateUnenrollmentStatus(tenantId: string, id: string, status: string) {
    const unenrollment = await this.prisma.clubUnenrollment.findFirst({
      where: { id, club: { tenantId } },
    });

    if (!unenrollment) {
      throw new NotFoundException('Unenrollment request not found');
    }

    const updatedUnenrollment = await this.prisma.clubUnenrollment.update({
      where: { id: unenrollment.id },
      data: {
        status: status as UnenrollmentStatus,
        processedAt: status !== 'PENDING' ? new Date() : null,
      },
      include: {
        student: true,
        club: true,
      },
    });

    // If approved, deactivate the enrollment
    if (status === 'APPROVED') {
      await this.prisma.clubEnrollment.updateMany({
        where: {
          studentId: unenrollment.studentId,
          clubId: unenrollment.clubId,
          status: 'ACTIVE',
        },
        data: { status: 'INACTIVE' as EnrollmentStatus },
      });
    }

    return updatedUnenrollment;
  }

  // Vendors
  async getVendors(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { contactPerson: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.vendor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async createVendor(tenantId: string, data: any) {
    // Use type assertion for status
    const vendorData: any = {
      ...data,
      tenantId,
      status: data.status as any, // VendorStatus enum
    };

    return this.prisma.vendor.create({
      data: vendorData,
    });
  }

  // Students
async getAdmittedStudents(tenantId: string, filters?: any) {
    const where: any = { 
      tenantId,
      // Students are already "admitted" since they're in the Student model
    };

    if (filters) {
      if (filters.className) {
        where.class = {
          name: { contains: filters.className, mode: 'insensitive' }
        };
      }
      if (filters.section) {
        where.section = {
          name: { contains: filters.section, mode: 'insensitive' }
        };
      }
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { admissionNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    // Fetch from Student model with class and section relations
    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        section: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { name: 'asc' },
    });

    return students;
  }

  // Employees
  async getEmployees(tenantId: string, filters?: any) {
    const where: any = { tenantId };

    if (filters) {
      if (filters.department) where.department = filters.department;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.employee.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        branch: true,
      },
    });
  }

  // Reports
  async getAttendanceReports(tenantId: string, filters?: any) {
    // Implementation for attendance reports
    const { startDate, endDate, clubId } = filters;

    const where: any = {
      enrollment: {
        club: { tenantId },
      },
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (clubId) {
      where.enrollment.clubId = clubId;
    }

    const attendanceRecords = await this.prisma.clubAttendance.findMany({
      where,
      include: {
        enrollment: {
          include: {
            student: true,
            club: true,
          },
        },
      },
    });

    // Process and format report data
    return this.formatAttendanceReport(attendanceRecords, filters);
  }

  async getFinancialReports(tenantId: string, filters?: any) {
    // Implementation for financial reports
    const { term, startDate, endDate } = filters;

    const where: any = {
      club: { tenantId },
    };

    if (term) where.term = term;
    if (startDate && endDate) {
      where.enrolledAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const enrollments = await this.prisma.clubEnrollment.findMany({
      where,
      include: {
        student: true,
        club: true,
        variant: true,
      },
    });

    return this.formatFinancialReport(enrollments, filters);
  }

  private formatAttendanceReport(records: any[], filters: any) {
    // Format attendance data for reports
    const summary = {
      totalRecords: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      excused: records.filter(r => r.status === 'EXCUSED').length,
    };

    return {
      summary,
      records,
      generatedAt: new Date(),
    };
  }

  private formatFinancialReport(enrollments: any[], filters: any) {
    // Format financial data for reports
    const revenueByClub = enrollments.reduce((acc, enrollment) => {
      const clubName = enrollment.club.name;
      if (!acc[clubName]) {
        acc[clubName] = {
          club: clubName,
          enrollments: 0,
          revenue: 0,
        };
      }
      acc[clubName].enrollments++;
      acc[clubName].revenue += enrollment.amount;
      return acc;
    }, {});

    const totalRevenue = enrollments.reduce((sum, enrollment) => sum + enrollment.amount, 0);

    return {
      summary: {
        totalEnrollments: enrollments.length,
        totalRevenue,
        averageRevenue: totalRevenue / (enrollments.length || 1),
      },
      revenueByClub: Object.values(revenueByClub),
      enrollments,
      generatedAt: new Date(),
    };
  }

  // extracurricular/extracurricular.service.ts (add these methods)

// External Staff Management
async getExternalStaff(tenantId: string, filters?: any) {
  const where: any = { tenantId };
  
  if (filters) {
    if (filters.specialization) {
      where.specialization = { contains: filters.specialization, mode: 'insensitive' };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { specialization: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
  }

  return this.prisma.externalStaff.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

async createExternalStaff(tenantId: string, data: any) {
  // Check if staff with same email already exists
  const existingStaff = await this.prisma.externalStaff.findFirst({
    where: { 
      email: data.email,
      tenantId 
    },
  });

  if (existingStaff) {
    throw new Error('External staff with this email already exists');
  }

  return this.prisma.externalStaff.create({
    data: {
      ...data,
      tenantId,
    },
  });
}

async updateExternalStaff(tenantId: string, id: string, data: any) {
  const staff = await this.prisma.externalStaff.findFirst({
    where: { id, tenantId },
  });

  if (!staff) {
    throw new NotFoundException('External staff not found');
  }

  // Check if email is being changed and if it conflicts with another staff
  if (data.email && data.email !== staff.email) {
    const emailExists = await this.prisma.externalStaff.findFirst({
      where: { 
        email: data.email,
        tenantId,
        id: { not: id }
      },
    });

    if (emailExists) {
      throw new Error('Another staff member with this email already exists');
    }
  }

  return this.prisma.externalStaff.update({
    where: { id: staff.id },
    data,
  });
}

async deleteExternalStaff(tenantId: string, id: string) {
  const staff = await this.prisma.externalStaff.findFirst({
    where: { id, tenantId },
  });

  if (!staff) {
    throw new NotFoundException('External staff not found');
  }

  // Check if staff is assigned to any clubs
  const clubAssignments = await this.prisma.club.count({
    where: { 
      vendorCoordinatorId: id,
      coordinatorType: 'VENDOR'
    },
  });

  if (clubAssignments > 0) {
    throw new Error('Cannot delete staff assigned to clubs');
  }

  return this.prisma.externalStaff.delete({
    where: { id: staff.id },
  });
}
// Add these methods to your extracurricular.service.ts

// External Staff Management

async getExternalStaffMember(tenantId: string, id: string) {
  const staff = await this.prisma.externalStaff.findFirst({
    where: { id, tenantId },
  });

  if (!staff) {
    throw new NotFoundException('External staff not found');
  }

  return staff;
}


}