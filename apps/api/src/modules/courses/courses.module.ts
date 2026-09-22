import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseRepository } from './course.repository';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CoursesController],
  providers: [CoursesService, CourseRepository],
  exports: [CoursesService, CourseRepository],
})
export class CoursesModule {}
