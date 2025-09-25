// agents/agents.module.ts
import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentService } from './agents.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AgentsController],
  providers: [AgentService, PrismaService],
  exports: [AgentService],
})
export class AgentsModule {}