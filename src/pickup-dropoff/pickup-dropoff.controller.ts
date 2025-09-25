// pickup-dropoff/pickup-dropoff.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PickupDropoffService } from './pickup-dropoff.service';

@Controller('pickup-dropoff')
@UseGuards(AuthGuard('jwt'))
export class PickupDropoffController {
  constructor(private readonly pickupDropoffService: PickupDropoffService) {}

  @Get('events')
  async getEvents(@Request() req, @Query() query: any) {
    return this.pickupDropoffService.getEvents(req.user.tenantId, query);
  }

  @Get('events/:id')
  async getEvent(@Request() req, @Param('id') id: string) {
    return this.pickupDropoffService.getEvent(req.user.tenantId, id);
  }

  @Post('events')
  async createEvent(@Request() req, @Body() data: any) {
    return this.pickupDropoffService.createEvent(req.user.tenantId, data);
  }

  @Put('events/:id')
  async updateEvent(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.pickupDropoffService.updateEvent(req.user.tenantId, id, data);
  }

  @Put('events/:id/status')
  async updateEventStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.pickupDropoffService.updateEventStatus(req.user.tenantId, id, data.status);
  }

  @Delete('events/:id')
  async deleteEvent(@Request() req, @Param('id') id: string) {
    return this.pickupDropoffService.deleteEvent(req.user.tenantId, id);
  }

  @Get('students')
  async getStudentsWithEnrollments(@Request() req) {
    return this.pickupDropoffService.getStudentsWithEnrollments(req.user.tenantId);
  }

  @Get('export')
  async exportRegister(@Request() req, @Query() query: any) {
    return this.pickupDropoffService.exportRegister(req.user.tenantId, query);
  }
}