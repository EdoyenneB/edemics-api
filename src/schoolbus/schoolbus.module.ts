// schoolbus/schoolbus.module.ts
import { Module } from '@nestjs/common';
import { SchoolBusService } from './schoolbus.service';
import { SchoolBusController } from './schoolbus.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentModule } from '../student/student.module';

@Module({
      imports: [PrismaModule, StudentModule], // Add StudentModule here
  
  controllers: [SchoolBusController],
  providers: [SchoolBusService, PrismaService],
  exports: [SchoolBusService],
})
export class SchoolBusModule {}