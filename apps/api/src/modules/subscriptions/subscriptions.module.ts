import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { UsageService } from './usage.service';
import { BillingService } from './billing.service';
import { PlanRepository } from './plan.repository';
import { SubscriptionRepository } from './subscription.repository';
import { PaymentRepository } from './payment.repository';
import { UsageCounterRepository } from './usage-counter.repository';

@Module({
  controllers: [SubscriptionController],
  providers: [
    UsageService,
    BillingService,
    PlanRepository,
    SubscriptionRepository,
    PaymentRepository,
    UsageCounterRepository,
  ],
  exports: [UsageService, PlanRepository, SubscriptionRepository],
})
export class SubscriptionsModule {}
