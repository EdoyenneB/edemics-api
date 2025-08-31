import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async createTenant(data: { name: string; subdomain: string }) {
    return this.prisma.tenant.create({
      data,
    });
  }

  async findTenantBySubdomain(subdomain: string) {
    return this.prisma.tenant.findUnique({
      where: { subdomain },
    });
  }

  async findTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  // tenants.service.ts (additional method)
async createTenantWithAdmin(data: {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string; 
}) {
  // Create tenant
  const tenant = await this.prisma.tenant.create({
    data: {
      name: data.name,
      subdomain: data.subdomain,
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
  const adminUser = await this.prisma.user.create({
    data: {
      email: data.adminEmail,
      password: hashedPassword,
      name: data.adminName,
      role: 'admin',
      tenantId: tenant.id,
    },
  });

  return {
    tenant,
    adminUser: {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    },
  };
}
}