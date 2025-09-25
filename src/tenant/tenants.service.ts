import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async createTenant(data: { name: string; subdomain: string }) {
    console.log('Creating tenant:', data);
    
    const tenant = await this.prisma.tenant.create({
      data,
    });
    
    console.log('Tenant created successfully:', tenant);
    return tenant;
  }

  async findTenantBySubdomain(subdomain: string) {
    console.log('Finding tenant by subdomain:', subdomain);
    
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });
    
    if (tenant) {
      console.log('Tenant found:', tenant);
    } else {
      console.log('Tenant not found for subdomain:', subdomain);
    }
    
    return tenant;
  }

  async findTenantById(id: string) {
    console.log('Finding tenant by ID:', id);
    
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
    });
    
    if (tenant) {
      console.log('Tenant found:', tenant);
    } else {
      console.log('Tenant not found for ID:', id);
    }
    
    return tenant;
  }

  // Method to get all users (for debugging/console logging)
  async getAllUsers() {
    console.log('Fetching all users...');
    
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        branchId: true,
      },
    });
    
    console.log('=== ALL USERS ===');
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      console.log(`  Branch ID: ${user.branchId || 'None'}`);
    });
    console.log('=================\n');
    
    return users;
  }

  // Method to get users by tenant
  async getUsersByTenant(tenantId: string) {
    console.log(`Fetching users for tenant ID: ${tenantId}`);
    
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        branchId: true,
      },
    });
    
    console.log(`=== USERS FOR TENANT ${tenantId} ===`);
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Branch ID: ${user.branchId || 'None'}`);
    });
    console.log('=================\n');
    
    return users;
  }

  // Method to get users by role
  async getUsersByRole(role: string) {
    console.log(`Fetching users with role: ${role}`);
    
    const users = await this.prisma.user.findMany({
      where: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        branchId: true,
      },
    });
    
    console.log(`=== USERS WITH ROLE "${role}" ===`);
    console.log(`Total users: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Tenant ID: ${user.tenantId}`);
      console.log(`  Branch ID: ${user.branchId || 'None'}`);
    });
    console.log('=================\n');
    
    return users;
  }

  // Enhanced createTenantWithAdmin with detailed logging
  async createTenantWithAdmin(data: {
    name: string;
    subdomain: string;
    adminEmail: string;
    adminPassword: string;
    adminName: string; 
  }) {
    console.log('=== CREATING TENANT WITH ADMIN ===');
    console.log('Tenant data:', {
      name: data.name,
      subdomain: data.subdomain,
      adminEmail: data.adminEmail,
      adminName: data.adminName
    });

    // Create tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
      },
    });
    
    console.log('✅ Tenant created:', {
      id: tenant.id,
      name: tenant.name,
      subdomain: tenant.subdomain
    });

    // Create admin user
    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);
    console.log('🔐 Password hashed successfully');
    
    const adminUser = await this.prisma.user.create({
      data: {
        email: data.adminEmail,
        password: hashedPassword,
        name: data.adminName,
        role: 'admin',
        tenantId: tenant.id,
      },
    });

    console.log('✅ Admin user created:', {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      tenantId: adminUser.tenantId
    });

    // Log all users after creation
    await this.getAllUsers();

    console.log('=== TENANT CREATION COMPLETE ===\n');
    
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

  // Method to create a test user (for debugging)
  async createTestUser(tenantId: string, userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    branchId?: string;
  }) {
    console.log('=== CREATING TEST USER ===');
    console.log('User data:', { ...userData, tenantId, password: '***' });

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        tenantId: tenantId,
        branchId: userData.branchId,
      },
    });

    console.log('✅ Test user created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      branchId: user.branchId
    });

    // Show updated user list
    await this.getUsersByTenant(tenantId);

    return user;
  }

  // Method to delete a user (for cleanup)
  async deleteUser(userId: string) {
    console.log(`🗑️  Deleting user with ID: ${userId}`);
    
    try {
      const user = await this.prisma.user.delete({
        where: { id: userId },
      });
      
      console.log('✅ User deleted:', {
        id: user.id,
        email: user.email,
        name: user.name
      });
      
      return user;
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  // Method to count users by tenant
  async getUserCounts() {
    console.log('📊 Getting user counts...');
    
    const userCounts = await this.prisma.user.groupBy({
      by: ['tenantId', 'role'],
      _count: {
        id: true,
      },
    });

    console.log('=== USER COUNTS BY TENANT AND ROLE ===');
    userCounts.forEach((count) => {
      console.log(`Tenant: ${count.tenantId}, Role: ${count.role}, Count: ${count._count.id}`);
    });
    console.log('====================================\n');

    return userCounts;
  }
}