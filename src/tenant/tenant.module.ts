import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule for PrismaService access
  controllers: [TenantController],
  providers: [TenantService],
  exports: [TenantService], 
})
export class TenantModule {}
