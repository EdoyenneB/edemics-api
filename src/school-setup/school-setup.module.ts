// school-setup.module.ts
import { Module } from '@nestjs/common';
import { SchoolSetupController } from './school-setup.controller';
import { SchoolSetupService } from './school-setup.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Import PrismaModule for PrismaService access
  controllers: [SchoolSetupController],
  providers: [SchoolSetupService],
})
export class SchoolSetupModule {}