import { Module } from '@nestjs/common';
import { ExtracurricularService } from './extracurricular.service';
import { ExtracurricularController } from './extracurricular.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // 👈 reuses PrismaService
  providers: [ExtracurricularService],
  controllers: [ExtracurricularController],
})
export class ExtracurricularModule {}
