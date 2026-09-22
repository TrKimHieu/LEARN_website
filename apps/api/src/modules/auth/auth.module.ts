import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, RefreshTokenRepository],
  exports: [AuthService],
})
export class AuthModule {}
