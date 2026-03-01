import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { SupabaseModule } from './config/supabase.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AdminModule } from './modules/admin/admin.module';
import { ConsultantsModule } from './modules/consultants/consultants.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { GuestsModule } from './modules/guests/guests.module';
import { RoadmapsModule } from './modules/roadmaps/roadmaps.module';
import { RoadmapSharesModule } from './modules/roadmap-shares/roadmap-shares.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    ProjectsModule,
    PaymentsModule,
    AdminModule,
    ConsultantsModule,
    ApplicationsModule,
    UploadsModule,
    GuestsModule,
    RoadmapsModule,
    RoadmapSharesModule,
  ],
})
export class AppModule {}
