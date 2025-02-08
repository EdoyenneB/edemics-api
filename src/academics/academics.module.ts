import { Module } from '@nestjs/common';
import { AcademicsService } from './academics.service';
import { AcademicsController } from './academics.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AcademicsController],
  providers: [AcademicsService, PrismaService], // PrismaService is shared across the app
})
export class AcademicsModule {}
