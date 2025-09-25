// schoolbus/schoolbus.module.ts
import { Module } from '@nestjs/common';
import { SchoolBusService } from './schoolbus.service';
import { SchoolBusController } from './schoolbus.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SchoolBusController],
  providers: [SchoolBusService, PrismaService],
  exports: [SchoolBusService],
})
export class SchoolBusModule {}