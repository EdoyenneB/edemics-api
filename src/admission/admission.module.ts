// admission/admission.module.ts
import { Module } from '@nestjs/common';
import { AdmissionService } from './admission.service';
import { AdmissionController } from './admission.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentModule } from '../student/student.module';

@Module({
    imports: [PrismaModule, StudentModule], // Add StudentModule here

  providers: [AdmissionService],
  controllers: [AdmissionController],
  exports: [AdmissionService],
})
export class AdmissionModule {}