import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { AcademicsModule } from './academics/academics.module';
import { AdmissionsModule } from './Admissions/admissions.module';
import { SchoolSetupModule } from './school-setup/school-setup.module';

@Module({
  imports: [PrismaModule, TenantModule, UserModule, AcademicsModule,AdmissionsModule, SchoolSetupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
