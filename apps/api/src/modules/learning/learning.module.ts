import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LessonsService } from './lessons.service';
import { ExercisesService } from './exercises.service';
import { ProgressService } from './progress.service';
import { LessonRepository } from './lesson.repository';
import { LearningProgressRepository } from './learning-progress.repository';
import { ExerciseRepository } from './exercise.repository';
import { SubmissionRepository } from './submission.repository';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [CoursesModule],
  controllers: [LearningController],
  providers: [
    LessonsService,
    ExercisesService,
    ProgressService,
    LessonRepository,
    LearningProgressRepository,
    ExerciseRepository,
    SubmissionRepository,
  ],
  exports: [LessonsService, ExercisesService],
})
export class LearningModule {}
