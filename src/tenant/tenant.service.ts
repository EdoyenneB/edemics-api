// tenant.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a tenant and its admin
  async createTenant(data: {
    name: string;
    domain: string;
    subscription: string;
    adminEmail: string;
    adminName: string;
    adminPassword: string;
  }) {
    const { name, domain, subscription, adminEmail, adminName, adminPassword } = data;

    const generateUniqueDomain = (name: string) => {
      const sanitized = name.toLowerCase().replace(/\s+/g, '-');
      const timestamp = Date.now();
      return `${sanitized}-${timestamp}.example.com`;
    };

    // Usage in createTenant
    const uniqueDomain = generateUniqueDomain(name);

    return this.prisma.$transaction(async (prisma) => {
      const tenant = await prisma.tenant.create({
        data: { name, domain: uniqueDomain, subscription },
      });

      const adminUser = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          name: adminName,
          role: 'admin',
          password: adminPassword, // Use hashed password in production
        },
      });

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { adminId: adminUser.id },
      });

      return tenant;
    });
  }

  // Fetch tenant details, including users and admin
  async getTenantById(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { admin: true, users: true },
    });
  }
}