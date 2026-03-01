import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { SupabasePaymentsRepository } from './repositories/payments.repository.supabase';
import { PAYMENTS_REPOSITORY } from './payments.service';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    { provide: PAYMENTS_REPOSITORY, useClass: SupabasePaymentsRepository },
  ],
})
export class PaymentsModule {}
