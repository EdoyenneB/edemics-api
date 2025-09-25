// schoolbus/schoolbus.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SchoolBusService {
  constructor(private prisma: PrismaService) {}

  // Bus Management
  async getBuses(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { plateNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.schoolBus.findMany({
      where,
      include: {
        driver: {
          include: {
            employee: true,
          },
        },
        administrator: {
          include: {
            employee: true,
          },
        },
        busRoute: true,
        busStops: true,
        busEnrollments: {
          include: {
            admissionApplication: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getBus(tenantId: string, id: string) {
    const bus = await this.prisma.schoolBus.findFirst({
      where: { id, tenantId },
      include: {
        driver: {
          include: {
            employee: true,
          },
        },
        administrator: {
          include: {
            employee: true,
          },
        },
        busRoute: true,
        busStops: {
          include: {
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
        },
        busEnrollments: {
          include: {
            admissionApplication: {
              include: {
                branch: true,
                school: true,
              },
            },
            route: true,
            stop: true,
          },
        },
      },
    });

    if (!bus) {
      throw new NotFoundException('Bus not found');
    }

    return bus;
  }

  async createBus(tenantId: string, data: any) {
    // Validate driver and administrator exist
    if (data.driverId) {
      const driver = await this.prisma.busStaff.findFirst({
        where: { id: data.driverId, tenantId, role: 'driver' },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
    }

    if (data.administratorId) {
      const admin = await this.prisma.busStaff.findFirst({
        where: { id: data.administratorId, tenantId, role: 'administrator' },
      });
      if (!admin) {
        throw new NotFoundException('Administrator not found');
      }
    }

    // Validate route exists
    if (data.routeId) {
      const route = await this.prisma.busRoute.findFirst({
        where: { id: data.routeId, tenantId },
      });
      if (!route) {
        throw new NotFoundException('Route not found');
      }
    }

    return this.prisma.schoolBus.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        driver: {
          include: {
            employee: true,
          },
        },
        administrator: {
          include: {
            employee: true,
          },
        },
        busRoute: true,
        busEnrollments: true,
      },
    });
  }

  async updateBus(tenantId: string, id: string, data: any) {
    const bus = await this.getBus(tenantId, id);

    // Validate related entities if provided
    if (data.driverId && data.driverId !== bus.driverId) {
      const driver = await this.prisma.busStaff.findFirst({
        where: { id: data.driverId, tenantId, role: 'driver' },
      });
      if (!driver) {
        throw new NotFoundException('Driver not found');
      }
    }

    if (data.administratorId && data.administratorId !== bus.administratorId) {
      const admin = await this.prisma.busStaff.findFirst({
        where: { id: data.administratorId, tenantId, role: 'administrator' },
      });
      if (!admin) {
        throw new NotFoundException('Administrator not found');
      }
    }

    if (data.routeId && data.routeId !== bus.routeId) {
      const route = await this.prisma.busRoute.findFirst({
        where: { id: data.routeId, tenantId },
      });
      if (!route) {
        throw new NotFoundException('Route not found');
      }
    }

    return this.prisma.schoolBus.update({
      where: { id: bus.id },
      data,
      include: {
        driver: {
          include: {
            employee: true,
          },
        },
        administrator: {
          include: {
            employee: true,
          },
        },
        busRoute: true,
        busEnrollments: true,
      },
    });
  }

  async deleteBus(tenantId: string, id: string) {
    const bus = await this.getBus(tenantId, id);

    // Check if bus has enrolled students
    const enrolledStudents = await this.prisma.busEnrollment.count({
      where: { busId: bus.id, tenantId },
    });

    if (enrolledStudents > 0) {
      throw new Error('Cannot delete bus with enrolled students');
    }

    return this.prisma.schoolBus.delete({
      where: { id: bus.id },
    });
  }

  // Route Management
  async getRoutes(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.busRoute.findMany({
      where,
      include: {
        busStops: {
          include: {
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
        },
        buses: {
          include: {
            busEnrollments: true,
          },
        },
        busEnrollments: {
          include: {
            admissionApplication: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getRoute(tenantId: string, id: string) {
    const route = await this.prisma.busRoute.findFirst({
      where: { id, tenantId },
      include: {
        busStops: {
          include: {
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        buses: {
          include: {
            driver: {
              include: {
                employee: true,
              },
            },
            administrator: {
              include: {
                employee: true,
              },
            },
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
        },
        busEnrollments: {
          include: {
            admissionApplication: {
              include: {
                branch: true,
                school: true,
              },
            },
            bus: true,
            stop: true,
          },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    return route;
  }

  async createRoute(tenantId: string, data: any) {
    const { busStops, ...routeData } = data;

    const route = await this.prisma.busRoute.create({
      data: {
        ...routeData,
        tenantId,
      },
    });

    // Create bus stops if provided
    if (busStops && busStops.length > 0) {
      await Promise.all(
        busStops.map(async (stop: any, index: number) => {
          await this.prisma.busStop.create({
            data: {
              ...stop,
              routeId: route.id,
              order: index + 1,
              tenantId,
            },
          });
        }),
      );
    }

    return this.getRoute(tenantId, route.id);
  }

  async updateRoute(tenantId: string, id: string, data: any) {
    const route = await this.getRoute(tenantId, id);
    const { busStops, ...routeData } = data;

    const updatedRoute = await this.prisma.busRoute.update({
      where: { id: route.id },
      data: routeData,
    });

    // Update bus stops if provided
    if (busStops) {
      // Delete existing stops
      await this.prisma.busStop.deleteMany({
        where: { routeId: route.id, tenantId },
      });

      // Create new stops
      await Promise.all(
        busStops.map(async (stop: any, index: number) => {
          await this.prisma.busStop.create({
            data: {
              ...stop,
              routeId: route.id,
              order: index + 1,
              tenantId,
            },
          });
        }),
      );
    }

    return this.getRoute(tenantId, route.id);
  }

  async deleteRoute(tenantId: string, id: string) {
    const route = await this.getRoute(tenantId, id);

    // Check if route has assigned buses
    const assignedBuses = await this.prisma.schoolBus.count({
      where: { routeId: route.id, tenantId },
    });

    if (assignedBuses > 0) {
      throw new Error('Cannot delete route with assigned buses');
    }

    // Check if route has enrollments
    const routeEnrollments = await this.prisma.busEnrollment.count({
      where: { routeId: route.id, tenantId },
    });

    if (routeEnrollments > 0) {
      throw new Error('Cannot delete route with active enrollments');
    }

    // Delete associated stops
    await this.prisma.busStop.deleteMany({
      where: { routeId: route.id, tenantId },
    });

    return this.prisma.busRoute.delete({
      where: { id: route.id },
    });
  }

  // Staff Management
  async getStaff(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.role) where.role = filters.role;
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    return this.prisma.busStaff.findMany({
      where,
      include: {
        employee: true,
        assignedBus: {
          include: {
            busRoute: true,
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStaffMember(tenantId: string, id: string) {
    const staff = await this.prisma.busStaff.findFirst({
      where: { id, tenantId },
      include: {
        employee: true,
        assignedBus: {
          include: {
            busRoute: true,
            driver: true,
            administrator: true,
            busEnrollments: {
              include: {
                admissionApplication: true,
              },
            },
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

  async createStaff(tenantId: string, data: any) {
    // Validate employee exists if provided and not empty
    if (data.employeeId && data.employeeId.trim() !== "") {
      const employee = await this.prisma.employee.findFirst({
        where: { id: data.employeeId, tenantId },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
    } else {
      data.employeeId = null;
    }

    // Validate bus exists if provided and not empty
    if (data.assignedBusId && data.assignedBusId.trim() !== "") {
      const bus = await this.prisma.schoolBus.findFirst({
        where: { id: data.assignedBusId, tenantId },
      });
      if (!bus) {
        throw new NotFoundException('Bus not found');
      }
    } else {
      data.assignedBusId = null;
    }

    // Convert yearsOfExperience to string if it's a number
    if (typeof data.yearsOfExperience === 'number') {
      data.yearsOfExperience = data.yearsOfExperience.toString();
    }

    const staffData = {
      ...data,
      employeeId: data.employeeId && data.employeeId.trim() !== "" ? data.employeeId : null,
      assignedBusId: data.assignedBusId && data.assignedBusId.trim() !== "" ? data.assignedBusId : null,
      yearsOfExperience: data.yearsOfExperience ? data.yearsOfExperience.toString() : null,
      licenseExpiry: data.licenseExpiry || null,
      photo: data.photo || null,
      vendorName: data.vendorName || null,
      vendorCompany: data.vendorCompany || null,
      vendorContact: data.vendorContact || null,
      vendorAddress: data.vendorAddress || null,
      tenantId,
    };

    return this.prisma.busStaff.create({
      data: staffData,
      include: {
        employee: true,
        assignedBus: {
          include: {
            busRoute: true,
            busEnrollments: true,
          },
        },
      },
    });
  }

  async updateStaff(tenantId: string, id: string, data: any) {
    const staff = await this.getStaffMember(tenantId, id);

    // Validate employee exists if changing
    if (data.employeeId && data.employeeId !== staff.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: { id: data.employeeId, tenantId },
      });
      if (!employee) {
        throw new NotFoundException('Employee not found');
      }
    }

    // Validate bus exists if changing
    if (data.assignedBusId && data.assignedBusId !== staff.assignedBusId) {
      const bus = await this.prisma.schoolBus.findFirst({
        where: { id: data.assignedBusId, tenantId },
      });
      if (!bus) {
        throw new NotFoundException('Bus not found');
      }
    }

    return this.prisma.busStaff.update({
      where: { id: staff.id },
      data,
      include: {
        employee: true,
        assignedBus: {
          include: {
            busRoute: true,
            busEnrollments: true,
          },
        },
      },
    });
  }

  async deleteStaff(tenantId: string, id: string) {
    const staff = await this.getStaffMember(tenantId, id);

    // Check if staff is assigned to any bus
    const driverAssignments = await this.prisma.schoolBus.count({
      where: { driverId: staff.id, tenantId },
    });

    const adminAssignments = await this.prisma.schoolBus.count({
      where: { administratorId: staff.id, tenantId },
    });

    if (driverAssignments > 0 || adminAssignments > 0) {
      throw new Error('Cannot delete staff member assigned to buses');
    }

    return this.prisma.busStaff.delete({
      where: { id: staff.id },
    });
  }

  // Enrollment Management (Replacing Student Assignments)
 // Update the getEnrollments method to include parent information
async getEnrollments(tenantId: string, filters?: any) {
  const where: any = { tenantId };
  
  if (filters) {
    if (filters.status) where.status = filters.status;
    if (filters.busId) where.busId = filters.busId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.feeStatus) where.feeStatus = filters.feeStatus;
    if (filters.routeId) where.routeId = filters.routeId;
    if (filters.stopId) where.stopId = filters.stopId;
  }

  const enrollments = await this.prisma.busEnrollment.findMany({
    where,
    include: {
      admissionApplication: {
        include: {
          branch: true,
          school: true,
        },
      },
      bus: {
        include: {
          busRoute: true,
          driver: true,
          administrator: true,
        },
      },
      route: true,
      stop: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Transform the data to match frontend expectations
  return enrollments.map(enrollment => ({
    ...enrollment,
    // Create a student object that matches what frontend expects
    student: enrollment.admissionApplication ? {
      id: enrollment.admissionApplication.id,
      name: `${enrollment.admissionApplication.firstName} ${enrollment.admissionApplication.lastName}`,
      // Map parent information from admission application
      parentStudents: [
        {
          parent: {
            name: enrollment.admissionApplication.fatherName || enrollment.admissionApplication.motherName || 'Unknown Parent',
            phone: enrollment.admissionApplication.fatherPhone || enrollment.admissionApplication.motherPhone || 'No phone',
            email: enrollment.admissionApplication.fatherEmail || enrollment.admissionApplication.motherEmail || 'No email',
          }
        }
      ],
      // Include class and section as strings (they're stored as strings in AdmissionApplication)
      class: { name: enrollment.admissionApplication.class || 'No class' },
      section: { name: enrollment.admissionApplication.section || 'No section' }
    } : null
  }));
}

// Similarly update the getEnrollment method
async getEnrollment(tenantId: string, id: string) {
  const enrollment = await this.prisma.busEnrollment.findFirst({
    where: { id, tenantId },
    include: {
      admissionApplication: {
        include: {
          branch: true,
          school: true,
        },
      },
      bus: {
        include: {
          busRoute: true,
          driver: true,
          administrator: true,
        },
      },
      route: true,
      stop: true,
    },
  });

  if (!enrollment) {
    throw new NotFoundException('Enrollment not found');
  }

  // Transform the data to match frontend expectations
  return {
    ...enrollment,
    student: enrollment.admissionApplication ? {
      id: enrollment.admissionApplication.id,
      name: `${enrollment.admissionApplication.firstName} ${enrollment.admissionApplication.lastName}`,
      parentStudents: [
        {
          parent: {
            name: enrollment.admissionApplication.fatherName || enrollment.admissionApplication.motherName || 'Unknown Parent',
            phone: enrollment.admissionApplication.fatherPhone || enrollment.admissionApplication.motherPhone || 'No phone',
            email: enrollment.admissionApplication.fatherEmail || enrollment.admissionApplication.motherEmail || 'No email',
          }
        }
      ],
      class: { name: enrollment.admissionApplication.class || 'No class' },
      section: { name: enrollment.admissionApplication.section || 'No section' }
    } : null
  };
}
  async createEnrollment(tenantId: string, data: any) {
    // Validate admission application exists and is admitted
    const admissionApplication = await this.prisma.admissionApplication.findFirst({
      where: {
        id: data.studentId,
        tenantId: tenantId,
        status: 'Admitted'
      }, 
    });

    if (!admissionApplication) {
      throw new NotFoundException('Student admission application not found or not admitted');
    }

    // Validate bus exists and is active
    const bus = await this.prisma.schoolBus.findFirst({
      where: { id: data.busId, tenantId, status: 'active' },
    });

    if (!bus) {
      throw new NotFoundException('Active bus not found');
    }

    // Validate route exists
    const route = await this.prisma.busRoute.findFirst({
      where: { id: data.routeId, tenantId },
    });

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    // Validate stop exists and belongs to route
    const stop = await this.prisma.busStop.findFirst({
      where: { id: data.stopId, routeId: data.routeId, tenantId },
    });

    if (!stop) {
      throw new NotFoundException('Bus stop not found or does not belong to selected route');
    }

    // Check if seat is available
    const existingEnrollment = await this.prisma.busEnrollment.findFirst({
      where: { 
        busId: data.busId, 
        seatNumber: data.seatNumber,
        status: 'active',
        tenantId 
      },
    });

    if (existingEnrollment) {
      throw new Error('Seat is already occupied');
    }

    // Check if admission application is already enrolled in an active bus
    const existingEnrollmentForStudent = await this.prisma.busEnrollment.findFirst({
      where: { 
        studentId: data.studentId,
        status: 'active',
        tenantId 
      },
    });

    if (existingEnrollmentForStudent) {
      throw new Error('Student is already enrolled in a bus service');
    }

    // Convert terms array to comma-separated string
    const termsString = Array.isArray(data.terms) 
      ? data.terms.join(', ') 
      : data.terms;

    return this.prisma.busEnrollment.create({
      data: {
        studentId: data.studentId,
        busId: data.busId,
        routeId: data.routeId,
        stopId: data.stopId,
        seatNumber: data.seatNumber,
        terms: termsString,
        status: 'active',
        feeStatus: 'pending',
        enrollmentDate: new Date(),
        tenantId: tenantId,
        schoolId: data.schoolId,
        branchId: data.branchId,
      },
      include: {
        admissionApplication: {
          include: {
            branch: true,
            school: true,
          },
        },
        bus: {
          include: {
            busRoute: true,
            driver: true,
            administrator: true,
          },
        },
        route: true,
        stop: true,
      },
    });
  }

  async updateEnrollment(tenantId: string, id: string, data: any) {
    const enrollment = await this.getEnrollment(tenantId, id);

    // Validate related entities if changing
    if (data.busId && data.busId !== enrollment.busId) {
      const bus = await this.prisma.schoolBus.findFirst({
        where: { id: data.busId, tenantId, status: 'active' },
      });
      if (!bus) {
        throw new NotFoundException('Active bus not found');
      }
    }

    if (data.routeId && data.routeId !== enrollment.routeId) {
      const route = await this.prisma.busRoute.findFirst({
        where: { id: data.routeId, tenantId },
      });
      if (!route) {
        throw new NotFoundException('Route not found');
      }
    }

    if (data.stopId && data.stopId !== enrollment.stopId) {
      const stop = await this.prisma.busStop.findFirst({
        where: { id: data.stopId, routeId: data.routeId || enrollment.routeId, tenantId },
      });
      if (!stop) {
        throw new NotFoundException('Bus stop not found or does not belong to route');
      }
    }

    // Validate seat availability if changing seat
    if (data.seatNumber && data.seatNumber !== enrollment.seatNumber) {
      const existingEnrollment = await this.prisma.busEnrollment.findFirst({
        where: { 
          busId: data.busId || enrollment.busId, 
          seatNumber: data.seatNumber,
          status: 'active',
          id: { not: id },
          tenantId 
        },
      });

      if (existingEnrollment) {
        throw new Error('Seat is already occupied');
      }
    }

    // Convert terms array to comma-separated string if provided
    if (data.terms) {
      data.terms = Array.isArray(data.terms) 
        ? data.terms.join(', ') 
        : data.terms;
    }

    return this.prisma.busEnrollment.update({
      where: { id: enrollment.id },
      data,
      include: {
        admissionApplication: {
          include: {
            branch: true,
            school: true,
          },
        },
        bus: {
          include: {
            busRoute: true,
            driver: true,
            administrator: true,
          },
        },
        route: true,
        stop: true,
      },
    });
  }

  async deleteEnrollment(tenantId: string, id: string) {
    const enrollment = await this.getEnrollment(tenantId, id);
    
    return this.prisma.busEnrollment.delete({
      where: { id: enrollment.id },
    });
  }

  async updateEnrollmentStatus(tenantId: string, id: string, status: string) {
    const enrollment = await this.getEnrollment(tenantId, id);
    
    return this.prisma.busEnrollment.update({
      where: { id: enrollment.id },
      data: { status },
      include: {
        admissionApplication: {
          include: {
            branch: true,
            school: true,
          },
        },
        bus: true,
        route: true,
        stop: true,
      },
    });
  }

  async updateFeeStatus(tenantId: string, id: string, feeStatus: string) {
    const enrollment = await this.getEnrollment(tenantId, id);
    
    return this.prisma.busEnrollment.update({
      where: { id: enrollment.id },
      data: { feeStatus },
      include: {
        admissionApplication: {
          include: {
            branch: true,
            school: true,
          },
        },
        bus: true,
        route: true,
        stop: true,
      },
    });
  }

  async bulkUpdateEnrollmentStatus(tenantId: string, ids: string[], status: string) {
    return this.prisma.busEnrollment.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
  }

  async bulkDeleteEnrollments(tenantId: string, ids: string[]) {
    return this.prisma.busEnrollment.deleteMany({
      where: { id: { in: ids }, tenantId },
    });
  }

  // Analytics and Reports (Updated for BusEnrollment)
  async getBusAnalytics(tenantId: string) {
    const totalBuses = await this.prisma.schoolBus.count({ where: { tenantId } });
    const activeBuses = await this.prisma.schoolBus.count({ 
      where: { tenantId, status: 'active' } 
    });
    const totalRoutes = await this.prisma.busRoute.count({ where: { tenantId } });
    const totalStaff = await this.prisma.busStaff.count({ where: { tenantId } });
    const totalEnrollments = await this.prisma.busEnrollment.count({ where: { tenantId } });
    const activeEnrollments = await this.prisma.busEnrollment.count({ 
      where: { tenantId, status: 'active' } 
    });

    const busUtilization = await this.prisma.schoolBus.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { busEnrollments: true },
        },
        busEnrollments: {
          where: { status: 'active' },
        },
      },
    });

    const routeStats = await this.prisma.busRoute.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { buses: true, busStops: true, busEnrollments: true },
        },
        buses: {
          include: {
            _count: {
              select: { busEnrollments: true },
            },
          },
        },
        busEnrollments: {
          where: { status: 'active' },
        },
      },
    });

    return {
      summary: {
        totalBuses,
        activeBuses,
        totalRoutes,
        totalStaff,
        totalEnrollments,
        activeEnrollments,
        utilizationRate: totalBuses > 0 ? (activeEnrollments / (totalBuses * 50)) * 100 : 0,
      },
      busUtilization,
      routeStats,
    };
  }

  // Helper methods for frontend integration
  async getAvailableDrivers(tenantId: string) {
    return this.prisma.busStaff.findMany({
      where: { 
        tenantId, 
        role: 'driver',
        status: 'active',
        OR: [
          { assignedBusId: null },
          { assignedBus: { status: 'inactive' } }
        ]
      },
      include: {
        employee: true,
      },
    });
  }

  async getAvailableAdministrators(tenantId: string) {
    return this.prisma.busStaff.findMany({
      where: { 
        tenantId, 
        role: 'administrator',
        status: 'active',
        OR: [
          { assignedBusId: null },
          { assignedBus: { status: 'inactive' } }
        ]
      },
      include: {
        employee: true,
      },
    });
  }

  async getActiveRoutes(tenantId: string) {
    return this.prisma.busRoute.findMany({
      where: { tenantId, status: 'active' },
      include: {
        busStops: true,
        busEnrollments: {
          where: { status: 'active' },
          include: {
            admissionApplication: true,
          },
        },
      },
    });
  }

  async getEmployeesForStaff(tenantId: string) {
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

  // Get enrolled students for a specific bus
  async getBusEnrollments(tenantId: string, busId: string) {
    return this.prisma.busEnrollment.findMany({
      where: { busId, tenantId, status: 'active' },
      include: {
        admissionApplication: {
          include: {
            branch: true,
            school: true,
          },
        },
        route: true,
        stop: true,
      },
      orderBy: { seatNumber: 'asc' },
    });
  }

  // Get available seats for a bus
  async getAvailableSeats(tenantId: string, busId: string) {
    const bus = await this.prisma.schoolBus.findFirst({
      where: { id: busId, tenantId },
    });

    if (!bus) {
      throw new NotFoundException('Bus not found');
    }

    const occupiedSeats = await this.prisma.busEnrollment.findMany({
      where: { busId, tenantId, status: 'active' },
      select: { seatNumber: true },
    });

    const occupiedSeatNumbers = occupiedSeats.map(seat => seat.seatNumber);
    const availableSeats = [];

    for (let i = 1; i <= bus.capacity; i++) {
      if (!occupiedSeatNumbers.includes(i)) {
        availableSeats.push(i);
      }
    }

    return availableSeats;
  }
   async getStudentAssignments(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.busId) where.busId = filters.busId;
      if (filters.stopId) where.stopId = filters.stopId;
      if (filters.studentId) where.studentId = filters.studentId;
    }

    return this.prisma.busStudentAssignment.findMany({
      where,
      include: {
        student: {
          include: {
            class: true,
            section: true,
          },
        },
        bus: {
          include: {
            busRoute: true,
          },
        },
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
   async assignStudentToBus(tenantId: string, data: any) {
    // Validate student exists
    const student = await this.prisma.student.findFirst({
      where: { id: data.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Validate bus exists
    const bus = await this.prisma.schoolBus.findFirst({
      where: { id: data.busId, tenantId },
    });
    if (!bus) {
      throw new NotFoundException('Bus not found');
    }

    // Validate stop exists and belongs to bus route
    if (data.stopId) {
      const stop = await this.prisma.busStop.findFirst({
        where: { id: data.stopId, routeId: bus.routeId, tenantId },
      });
      if (!stop) {
        throw new NotFoundException('Bus stop not found or does not belong to bus route');
      }
    }

    // Check if student is already assigned to a bus
    const existingAssignment = await this.prisma.busStudentAssignment.findFirst({
      where: { studentId: data.studentId, tenantId },
    });

    if (existingAssignment) {
      throw new Error('Student is already assigned to a bus');
    }

    return this.prisma.busStudentAssignment.create({
      data: {
        ...data,
        tenantId,
      },
      include: {
        student: {
          include: {
            class: true,
            section: true,
          },
        },
        bus: {
          include: {
            busRoute: true,
          },
        },
        stop: true,
      },
    });
  }

  async updateStudentAssignment(tenantId: string, id: string, data: any) {
    const assignment = await this.prisma.busStudentAssignment.findFirst({
      where: { id, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Validate bus exists if changing
    if (data.busId && data.busId !== assignment.busId) {
      const bus = await this.prisma.schoolBus.findFirst({
        where: { id: data.busId, tenantId },
      });
      if (!bus) {
        throw new NotFoundException('Bus not found');
      }
    }

    // Validate stop exists if changing
    if (data.stopId && data.stopId !== assignment.stopId) {
      const stop = await this.prisma.busStop.findFirst({
        where: { id: data.stopId, tenantId },
      });
      if (!stop) {
        throw new NotFoundException('Bus stop not found');
      }
    }

    return this.prisma.busStudentAssignment.update({
      where: { id: assignment.id },
      data,
      include: {
        student: {
          include: {
            class: true,
            section: true,
          },
        },
        bus: {
          include: {
            busRoute: true,
          },
        },
        stop: true,
      },
    });
  }
  async removeStudentFromBus(tenantId: string, id: string) {
    const assignment = await this.prisma.busStudentAssignment.findFirst({
      where: { id, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.prisma.busStudentAssignment.delete({
      where: { id: assignment.id },
    });
  }
}