import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: { tenantId: string; email: string; name: string; role: string; password: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async getUsersByTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
    });
  }
}
