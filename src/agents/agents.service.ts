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

    return this.prisma.agent.findMany({
      where,
      include: {
        students: {
          include: {
            class: true,
            section: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getAgent(tenantId: string, id: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, tenantId },
      include: {
        students: {
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
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return agent;
  }

  async createAgent(tenantId: string, data: any) {
    const { studentIds, ...agentData } = data;

    // Validate students exist
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        const student = await this.prisma.student.findFirst({
          where: { id: studentId, tenantId },
        });
        if (!student) {
          throw new NotFoundException(`Student with ID ${studentId} not found`);
        }
      }
    }

    return this.prisma.agent.create({
      data: {
        ...agentData,
        tenantId,
        students: {
          connect: studentIds.map((id: string) => ({ id })),
        },
      },
      include: {
        students: {
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
      },
    });
  }

  async updateAgent(tenantId: string, id: string, data: any) {
    const agent = await this.getAgent(tenantId, id);
    const { studentIds, ...agentData } = data;

    // Validate students exist if changing
    if (studentIds) {
      for (const studentId of studentIds) {
        const student = await this.prisma.student.findFirst({
          where: { id: studentId, tenantId },
        });
        if (!student) {
          throw new NotFoundException(`Student with ID ${studentId} not found`);
        }
      }
    }

    return this.prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...agentData,
        students: studentIds ? {
          set: studentIds.map((id: string) => ({ id })),
        } : undefined,
      },
      include: {
        students: {
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
      },
    });
  }

  async deleteAgent(tenantId: string, id: string) {
    const agent = await this.getAgent(tenantId, id);
    
    return this.prisma.agent.delete({
      where: { id: agent.id },
    });
  }

  async updateAgentStatus(tenantId: string, id: string, status: string) {
    const agent = await this.getAgent(tenantId, id);
    
    return this.prisma.agent.update({
      where: { id: agent.id },
      data: { status },
      include: {
        students: {
          include: {
            class: true,
            section: true,
          },
        },
      },
    });
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
}