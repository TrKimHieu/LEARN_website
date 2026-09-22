import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AIJobRepository } from './ai-job.repository';
import { GenerationRunRepository } from './generation-run.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CoursesModule } from '../courses/courses.module';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [SubscriptionsModule, CoursesModule, DocumentsModule],
  controllers: [AiController],
  providers: [AiService, AIJobRepository, GenerationRunRepository],
  exports: [AiService],
})
export class AiModule {}
