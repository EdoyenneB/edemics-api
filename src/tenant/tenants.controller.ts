import { Controller, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  async create(@Body() data: { name: string; subdomain: string }) {
    return this.tenantsService.createTenant(data);
  }
  // tenants.controller.ts (additional endpoint)
@Post('create-with-admin')
async createTenantWithAdmin(@Body() data: {
  name: string;
  subdomain: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}) {
  return this.tenantsService.createTenantWithAdmin(data);
}
}