import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() body: { tenantId: string; email: string; name: string; role: string; password: string }) {
    return this.userService.createUser(body);
  }

  @Get()
  async getUsers(@Query('tenantId') tenantId: string) {
    return this.userService.getUsersByTenant(tenantId);
  }
}
