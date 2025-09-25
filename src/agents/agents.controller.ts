// agents/agents.controller.ts
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
import { AgentService } from './agents.service';

@Controller('agents')
@UseGuards(AuthGuard('jwt'))
export class AgentsController {
  constructor(private readonly agentService: AgentService) {}

  @Get()
  async getAgents(@Request() req, @Query() query: any) {
    return this.agentService.getAgents(req.user.tenantId, query);
  }

  @Get(':id')
  async getAgent(@Request() req, @Param('id') id: string) {
    return this.agentService.getAgent(req.user.tenantId, id);
  }

  @Post()
  async createAgent(@Request() req, @Body() data: any) {
    return this.agentService.createAgent(req.user.tenantId, data);
  }

  @Put(':id')
  async updateAgent(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.agentService.updateAgent(req.user.tenantId, id, data);
  }

  @Delete(':id')
  async deleteAgent(@Request() req, @Param('id') id: string) {
    return this.agentService.deleteAgent(req.user.tenantId, id);
  }

  @Put(':id/status')
  async updateAgentStatus(@Request() req, @Param('id') id: string, @Body() data: any) {
    return this.agentService.updateAgentStatus(req.user.tenantId, id, data.status);
  }

  @Post('bulk/status')
  async bulkUpdateStatus(@Request() req, @Body() data: any) {
    return this.agentService.bulkUpdateAgentStatus(req.user.tenantId, data.ids, data.status);
  }

  @Post('bulk/delete')
  async bulkDeleteAgents(@Request() req, @Body() data: any) {
    return this.agentService.bulkDeleteAgents(req.user.tenantId, data.ids);
  }
}