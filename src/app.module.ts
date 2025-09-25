import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TenantsModule } from './tenant/tenants.module';
import { AdmissionModule } from './admission/admission.module';
import { FormConfigurationModule} from './form-configuration/form-configuration.module'
import { SchoolBusModule} from './schoolbus/schoolbus.module'
import { AgentsModule} from './agents/agent.module'
import { StudentModule} from './student/student.module'



import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OnboardingModule,
    AdmissionModule,
    TenantsModule,
    FormConfigurationModule,
    SchoolBusModule,
    AgentsModule,
    StudentModule
  ],
})
export class AppModule {}