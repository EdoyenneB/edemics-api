// agents/agents.module.ts
import { Module } from '@nestjs/common';
import { PickupDropoffController } from './pickup-dropoff.controller';
import { PickupDropoffService } from './pickup-dropoff.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PickupDropoffController],
  providers: [PickupDropoffService, PrismaService],
  exports: [PickupDropoffService],
})
export class PickupDropoffModule {}