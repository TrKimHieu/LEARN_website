import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentRepository } from './document.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [SubscriptionsModule, CoursesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentRepository],
  exports: [DocumentsService, DocumentRepository],
})
export class DocumentsModule {}
