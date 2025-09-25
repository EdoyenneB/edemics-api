// pickup-dropoff/pickup-dropoff.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PickupDropoffService {
  constructor(private prisma: PrismaService) {}

  async getEvents(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.busId) where.busId = filters.busId;
      if (filters.date) where.eventDate = filters.date;
      if (filters.search) {
        where.OR = [
          { admissionApplication: { firstName: { contains: filters.search, mode: 'insensitive' } } },
          { admissionApplication: { lastName: { contains: filters.search, mode: 'insensitive' } } },
          { stop: { name: { contains: filters.search, mode: 'insensitive' } } },
        ];
      }
    }

    const events = await this.prisma.pickupDropoffEvent.findMany({
      where,
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
        agent: true,
      },
      orderBy: { eventDate: 'desc', eventTime: 'asc' },
    });

    // Transform using only admission application data
    return events.map(event => ({
      ...event,
      // Create student object purely from admission application
      student: event.admissionApplication ? this.transformAdmissionToStudent(event.admissionApplication) : null
    }));
  }

  async getEvent(tenantId: string, id: string) {
    const event = await this.prisma.pickupDropoffEvent.findFirst({
      where: { id, tenantId },
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
        agent: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return {
      ...event,
      student: event.admissionApplication ? this.transformAdmissionToStudent(event.admissionApplication) : null
    };
  }

  async createEvent(tenantId: string, data: any) {
    // Validate admission application exists and is admitted
    const admissionApplication = await this.prisma.admissionApplication.findFirst({
      where: { 
        id: data.studentId, 
        tenantId,
        status: 'Admitted'
      },
    });

    if (!admissionApplication) {
      throw new NotFoundException('Admitted student admission application not found');
    }

    // Validate other entities
    const [bus, route, stop, agent] = await Promise.all([
      this.prisma.schoolBus.findFirst({ where: { id: data.busId, tenantId } }),
      this.prisma.busRoute.findFirst({ where: { id: data.routeId, tenantId } }),
      this.prisma.busStop.findFirst({ where: { id: data.stopId, tenantId } }),
      this.prisma.agent.findFirst({ where: { id: data.agentId, tenantId } })
    ]);

    if (!bus) throw new NotFoundException('Bus not found');
    if (!route) throw new NotFoundException('Route not found');
    if (!stop) throw new NotFoundException('Bus stop not found');
    if (!agent) throw new NotFoundException('Agent not found');

    const event = await this.prisma.pickupDropoffEvent.create({
      data: {
        ...data,
        tenantId,
        status: 'completed',
      },
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
        agent: true,
      },
    });

    return {
      ...event,
      student: event.admissionApplication ? this.transformAdmissionToStudent(event.admissionApplication) : null
    };
  }

  async updateEvent(tenantId: string, id: string, data: any) {
    const event = await this.getEvent(tenantId, id);

    // Validate admission application if changing
    if (data.studentId && data.studentId !== event.studentId) {
      const admissionApplication = await this.prisma.admissionApplication.findFirst({
        where: { 
          id: data.studentId, 
          tenantId,
          status: 'Admitted'
        },
      });
      if (!admissionApplication) {
        throw new NotFoundException('Admitted student admission application not found');
      }
    }

    if (data.agentId && data.agentId !== event.agentId) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: data.agentId, tenantId },
      });
      if (!agent) throw new NotFoundException('Agent not found');
    }

    const updatedEvent = await this.prisma.pickupDropoffEvent.update({
      where: { id: event.id },
      data,
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
        agent: true,
      },
    });

    return {
      ...updatedEvent,
      student: updatedEvent.admissionApplication ? this.transformAdmissionToStudent(updatedEvent.admissionApplication) : null
    };
  }

  async updateEventStatus(tenantId: string, id: string, status: string) {
    const event = await this.prisma.pickupDropoffEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) throw new NotFoundException('Event not found');
    
    const updatedEvent = await this.prisma.pickupDropoffEvent.update({
      where: { id: event.id },
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
        agent: true,
      },
    });

    return {
      ...updatedEvent,
      student: updatedEvent.admissionApplication ? this.transformAdmissionToStudent(updatedEvent.admissionApplication) : null
    };
  }

  async deleteEvent(tenantId: string, id: string) {
    const event = await this.prisma.pickupDropoffEvent.findFirst({
      where: { id, tenantId },
    });

    if (!event) throw new NotFoundException('Event not found');
    
    return this.prisma.pickupDropoffEvent.delete({
      where: { id: event.id },
    });
  }

 // In getStudentsWithEnrollments method, remove the problematic include:
async getStudentsWithEnrollments(tenantId: string) {
  const admissionApplications = await this.prisma.admissionApplication.findMany({
    where: { 
      tenantId,
      status: 'Admitted'
    },
    include: {
      busEnrollments: {
        include: {
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
        where: { status: 'active' },
      },
      // Remove this problematic include:
      // agents: {
      //   include: { agent: true },
      // },
      branch: true,
      school: true,
    },
    orderBy: { firstName: 'asc' },
  });

  // Then manually fetch agents if needed
  return admissionApplications.map(app => this.transformAdmissionToStudent(app));
}

  async exportRegister(tenantId: string, filters: any) {
    const events = await this.getEvents(tenantId, filters);
    
    return events.map(event => ({
      Date: event.eventDate,
      Time: event.eventTime,
      Student: event.student?.name,
      Class: event.student?.class?.name,
      Section: event.student?.section?.name,
      Bus: event.bus?.name,
      Route: event.route?.name,
      Stop: event.stop?.name,
      Type: event.type,
      Status: event.status,
      Agent: event.agent?.name,
      Relationship: event.agent?.relationship,
      Parent: event.student?.parentName,
      ParentPhone: event.student?.parentPhone,
    }));
  }

  // Helper method to transform admission application to student format
  private transformAdmissionToStudent(admissionApplication: any) {
    return {
      id: admissionApplication.id,
      name: `${admissionApplication.firstName} ${admissionApplication.lastName}`,
      firstName: admissionApplication.firstName,
      lastName: admissionApplication.lastName,
      // Parent information directly from admission application
      parentName: admissionApplication.fatherName || admissionApplication.motherName || admissionApplication.guardianName || 'Unknown Parent',
      parentPhone: admissionApplication.fatherPhone || admissionApplication.motherPhone || admissionApplication.guardianPhone || admissionApplication.emergencyPhone || 'No phone',
      parentEmail: admissionApplication.fatherEmail || admissionApplication.motherEmail || admissionApplication.guardianEmail || 'No email',
      
      class: { name: admissionApplication.class || 'No class' },
      section: { name: admissionApplication.section || 'No section' },
      
      // Include the original admission application for reference
      admissionApplication: admissionApplication,
      
      // Map related data
      busEnrollments: admissionApplication.busEnrollments || [],
      agents: admissionApplication.agents ? admissionApplication.agents.map((agentRel: any) => agentRel.agent) : []
    };
  }

  // Helper methods for frontend integration
  async getAvailableStudents(tenantId: string) {
    const applications = await this.prisma.admissionApplication.findMany({
      where: { 
        tenantId,
        status: 'Admitted',
        busEnrollments: {
          some: { status: 'active' }
        }
      },
      include: {
        busEnrollments: {
          where: { status: 'active' },
          include: {
            bus: true,
            route: true,
            stop: true,
          },
        },
       
      },
    });

    return applications.map(app => this.transformAdmissionToStudent(app));
  }

  async getStudentEvents(tenantId: string, studentId: string) {
    const events = await this.prisma.pickupDropoffEvent.findMany({
      where: { 
        studentId,
        tenantId 
      },
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
        agent: true,
      },
      orderBy: { eventDate: 'desc', eventTime: 'desc' },
    });

    return events.map(event => ({
      ...event,
      student: event.admissionApplication ? this.transformAdmissionToStudent(event.admissionApplication) : null
    }));
  }
}