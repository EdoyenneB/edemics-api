import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // Create a new tenant with an admin user
  @Post()
  async createTenant(@Body() body: any) {
    return this.tenantService.createTenant(body);
  }

  // Fetch tenant details, including users and admin
  @Get(':id')
  async getTenant(@Param('id') tenantId: string) {
    return this.tenantService.getTenantById(tenantId);
  }
}
