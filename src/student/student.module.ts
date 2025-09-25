
// student/student.module.ts
import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}