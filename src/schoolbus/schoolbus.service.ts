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
          { route: { contains: filters.search, mode: 'insensitive' } },
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
            students: true,
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
      },
    });
  }

  async deleteBus(tenantId: string, id: string) {
    const bus = await this.getBus(tenantId, id);

    // Check if bus has assigned students
    const assignedStudents = await this.prisma.busStudentAssignment.count({
      where: { busId: bus.id, tenantId },
    });

    if (assignedStudents > 0) {
      throw new Error('Cannot delete bus with assigned students');
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
            students: true,
          },
        },
        buses: true,
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
            students: true,
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
          },
        },
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    return staff;
  }

 // schoolbus/schoolbus.service.ts - fix the createStaff method

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
    // Set to null if empty string or not provided
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
    // Set to null if empty string or not provided
    data.assignedBusId = null;
  }

  // Convert yearsOfExperience to string if it's a number
  if (typeof data.yearsOfExperience === 'number') {
    data.yearsOfExperience = data.yearsOfExperience.toString();
  }

  // Ensure all required fields are properly formatted
  const staffData = {
    ...data,
    // Convert empty strings to null for optional fields
    employeeId: data.employeeId && data.employeeId.trim() !== "" ? data.employeeId : null,
    assignedBusId: data.assignedBusId && data.assignedBusId.trim() !== "" ? data.assignedBusId : null,
    yearsOfExperience: data.yearsOfExperience ? data.yearsOfExperience.toString() : null,
    // Ensure other number fields are converted to strings
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

  // Student Assignments
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

  // Analytics and Reports
  async getBusAnalytics(tenantId: string) {
    const totalBuses = await this.prisma.schoolBus.count({ where: { tenantId } });
    const activeBuses = await this.prisma.schoolBus.count({ 
      where: { tenantId, status: 'active' } 
    });
    const totalRoutes = await this.prisma.busRoute.count({ where: { tenantId } });
    const totalStaff = await this.prisma.busStaff.count({ where: { tenantId } });
    const totalStudents = await this.prisma.busStudentAssignment.count({ where: { tenantId } });

    const busUtilization = await this.prisma.schoolBus.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    const routeStats = await this.prisma.busRoute.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { buses: true, busStops: true },
        },
        buses: {
          include: {
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });

    return {
      summary: {
        totalBuses,
        activeBuses,
        totalRoutes,
        totalStaff,
        totalStudents,
        utilizationRate: totalBuses > 0 ? (totalStudents / (totalBuses * 50)) * 100 : 0, // Assuming 50 capacity per bus
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
          { assignedBus: { status: 'inactive' } } // Allow drivers from inactive buses
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

  // schoolbus/schoolbus.service.ts (add these methods)
// Enrollment Management
async getEnrollments(tenantId: string, filters?: any) {
  const where: any = { tenantId };
  
  if (filters) {
    if (filters.status) where.status = filters.status;
    if (filters.busId) where.busId = filters.busId;
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.feeStatus) where.feeStatus = filters.feeStatus;
  }

  return this.prisma.busEnrollment.findMany({
    where,
    include: {
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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
}

async getEnrollment(tenantId: string, id: string) {
  const enrollment = await this.prisma.busEnrollment.findFirst({
    where: { id, tenantId },
    include: {
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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

  return enrollment;
}

async createEnrollment(tenantId: string, data: any) {
  // Validate student exists and is admitted
  const student = await this.prisma.student.findFirst({
    where: { id: data.studentId, tenantId },
    include: {
      parentStudents: {
        include: {
          parent: true,
        },
      },
    },
  });

  if (!student) {
    throw new NotFoundException('Student not found');
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

  // Check if student is already enrolled in an active bus
  const existingStudentEnrollment = await this.prisma.busEnrollment.findFirst({
    where: { 
      studentId: data.studentId, 
      status: 'active',
      tenantId 
    },
  });

  if (existingStudentEnrollment) {
    throw new Error('Student is already enrolled in a bus service');
  }

  return this.prisma.busEnrollment.create({
    data: {
      ...data,
      tenantId,
      status: 'active',
      feeStatus: 'pending',
      enrollmentDate: new Date().toISOString(),
    },
    include: {
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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

  return this.prisma.busEnrollment.update({
    where: { id: enrollment.id },
    data,
    include: {
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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
      student: {
        include: {
          class: true,
          section: true,
          parentStudents: {
            include: {
              parent: true,
            },
          },
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
}