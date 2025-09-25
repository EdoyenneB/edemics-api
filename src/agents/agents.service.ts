// agents/agents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentService {
  constructor(private prisma: PrismaService) {}

  async getAgents(tenantId: string, filters?: any) {
    const where: any = { tenantId };
    
    if (filters) {
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
    }

    const agents = await this.prisma.agent.findMany({
      where,
      include: {
        admissionApplications: {
          include: {
            branch: true,
            school: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Transform the data to match frontend expectations
    return agents.map(agent => ({
      ...agent,
      // Map admissionApplications to students for frontend compatibility
      students: agent.admissionApplications ? agent.admissionApplications.map(app => ({
        id: app.id, // Use app.id instead of applicationNumber
        firstName: app.firstName, // Add firstName directly
        lastName: app.lastName,   // Add lastName directly
        admissionNumber: app.applicationNumber, // Add admissionNumber
        // Map parent information from admission application
        parentStudents: [
          {
            parent: {
              name: app.fatherName || app.motherName || app.guardianName || 'Unknown Parent',
              phone: app.fatherPhone || app.motherPhone || app.guardianPhone || app.emergencyPhone || 'No phone',
              email: app.fatherEmail || app.motherEmail || app.guardianEmail || 'No email',
            }
          }
        ],
        class: { name: app.class || 'No class' },
        section: { name: app.section || 'No section' },
        // Include admission application details
        admissionApplication: app
      })) : []
    }));
  }

  async getAgent(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      include: {
        admissionApplications: {
          include: {
            branch: true,
            school: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Transform the data to match frontend expectations
    return {
      ...agent,
      students: agent.admissionApplications ? agent.admissionApplications.map(app => ({
        id: app.id, // Use app.id
        firstName: app.firstName, // Add firstName directly
        lastName: app.lastName,   // Add lastName directly
        admissionNumber: app.applicationNumber, // Add admissionNumber
        parentStudents: [
          {
            parent: {
              name: app.fatherName || app.motherName || app.guardianName || 'Unknown Parent',
              phone: app.fatherPhone || app.motherPhone || app.guardianPhone || app.emergencyPhone || 'No phone',
              email: app.fatherEmail || app.motherEmail || app.guardianEmail || 'No email',
            }
          }
        ],
        class: { name: app.class || 'No class' },
        section: { name: app.section || 'No section' },
        admissionApplication: app
      })) : []
    };
  }


 // agents/agents.service.ts
// agents/agents.service.ts
// agents/agents.service.ts
async createAgent(tenantId: string, data: any) {
    const { studentIds, ...agentData } = data; // This should be admissionApplicationIds

    // Validate admission applications exist and are admitted
    if (studentIds && studentIds.length > 0) {
        for (const appId of studentIds) { 
            const application = await this.prisma.admissionApplication.findFirst({
                where: { 
                    id: appId, 
                    tenantId,
                    status: 'Admitted'
                },
            });
            if (!application) {
                throw new NotFoundException(`Admitted admission application with ID ${appId} not found`);
            }
        }
    }

    const agent = await this.prisma.agent.create({
        data: {
            ...agentData,
            tenantId,
            // Use the correct relation field name
            admissionApplications: studentIds ? {
                connect: studentIds.map((id: string) => ({ id })),
            } : undefined,
        },
        include: {
            admissionApplications: {
                include: {
                    branch: true,
                    school: true,
                },
            },
        },
    });

    // Transform the response
    return {
        ...agent,
        students: agent.admissionApplications ? agent.admissionApplications.map(app => ({
            id: app.id,
            name: `${app.firstName} ${app.lastName}`,
            parentStudents: [
                {
                    parent: {
                        name: app.fatherName || app.motherName || app.guardianName || 'Unknown Parent',
                        phone: app.fatherPhone || app.motherPhone || app.guardianPhone || app.emergencyPhone || 'No phone',
                        email: app.fatherEmail || app.motherEmail || app.guardianEmail || 'No email',
                    }
                }
            ],
            class: { name: app.class || 'No class' },
            section: { name: app.section || 'No section' },
            admissionApplication: app
        })) : []
    };
}

  async updateAgent(tenantId: string, id: string, data: any) {
    const agent = await this.getAgent(tenantId, id);
    const { admissionApplicationIds, ...agentData } = data;

    // Validate admission applications exist and are admitted if changing
    if (admissionApplicationIds) {
      for (const appId of admissionApplicationIds) {
        const application = await this.prisma.admissionApplication.findFirst({
          where: { 
            id: appId, 
            tenantId,
            status: 'Admitted'
          },
        });
        if (!application) {
          throw new NotFoundException(`Admitted admission application with ID ${appId} not found`);
        }
      }
    }

    const updatedAgent = await this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...agentData,
        admissionApplications: admissionApplicationIds ? {
          set: admissionApplicationIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        admissionApplications: {
          include: {
            branch: true,
            school: true,
          },
        },
      },
    });

    // Transform the response
    return {
      ...updatedAgent,
      students: updatedAgent.admissionApplications ? updatedAgent.admissionApplications.map(app => ({
        id: app.id,
        name: `${app.firstName} ${app.lastName}`,
        parentStudents: [
          {
            parent: {
              name: app.fatherName || app.motherName || app.guardianName || 'Unknown Parent',
              phone: app.fatherPhone || app.motherPhone || app.guardianPhone || app.emergencyPhone || 'No phone',
              email: app.fatherEmail || app.motherEmail || app.guardianEmail || 'No email',
            }
          }
        ],
        class: { name: app.class || 'No class' },
        section: { name: app.section || 'No section' },
        admissionApplication: app
      })) : []
    };
  }

  async deleteAgent(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    
    return this.prisma.agent.delete({
      where: { id: agent.id },
    });
  }

  async updateAgentStatus(tenantId: string, id: string, status: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    
    const updatedAgent = await this.prisma.agent.update({
      where: { id: agent.id },
      data: { status },
      include: {
        admissionApplications: {
          include: {
            branch: true,
            school: true,
          },
        },
      },
    });

    // Transform the response
    return {
      ...updatedAgent,
      students: updatedAgent.admissionApplications ? updatedAgent.admissionApplications.map(app => ({
        id: app.id,
        name: `${app.firstName} ${app.lastName}`,
        parentStudents: [
          {
            parent: {
              name: app.fatherName || app.motherName || app.guardianName || 'Unknown Parent',
              phone: app.fatherPhone || app.motherPhone || app.guardianPhone || app.emergencyPhone || 'No phone',
              email: app.fatherEmail || app.motherEmail || app.guardianEmail || 'No email',
            }
          }
        ],
        class: { name: app.class || 'No class' },
        section: { name: app.section || 'No section' },
        admissionApplication: app
      })) : []
    };
  }

  async bulkUpdateAgentStatus(tenantId: string, ids: string[], status: string) {
    return this.prisma.agent.updateMany({
      where: { id: { in: ids }, tenantId },
      data: { status },
    });
  }

  async bulkDeleteAgents(tenantId: string, ids: string[]) {
    return this.prisma.agent.deleteMany({
      where: { id: { in: ids }, tenantId },
    });
  }

  // Helper methods for frontend integration
  async getAvailableAdmissionApplications(tenantId: string) {
    return this.prisma.admissionApplication.findMany({
      where: { 
        tenantId,
        status: 'Admitted',
        agents: { // Students not assigned to any agent
          none: {}
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        class: true,
        section: true,
        fatherName: true,
        motherName: true,
        fatherPhone: true,
        motherPhone: true,
        branch: true,
        school: true,
      },
    });
  }

  async getAgentAdmissionApplications(tenantId: string, agentId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, tenantId },
      include: {
        admissionApplications: {
          include: {
            branch: true,
            school: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent.admissionApplications;
  }
}