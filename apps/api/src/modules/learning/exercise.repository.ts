import { Injectable } from '@nestjs/common';
import { PrismaService, type Db } from '../../common/services';

@Injectable()
export class ExerciseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bài tập đầu tiên (theo orderIndex) của một bài học — kèm câu hỏi/đáp án.
   * Bản đọc KHÔNG lộ isCorrect / correctAnswer trước khi nộp `[SPEC]`.
   */
  findFirstForLesson(lessonId: string, db: Db = this.prisma.client) {
    return db.exercise.findFirst({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: { options: { orderBy: { orderIndex: 'asc' } } },
        },
      },
    });
  }

  /**
   * Số bài tập theo từng bài học — thay cho N câu COUNT khi liệt kê bài học.
   */
  countByLesson(courseId: string, db: Db = this.prisma.client) {
    return db.exercise.groupBy({
      by: ['lessonId'],
      where: { lesson: { courseId } },
      _count: true,
    });
  }
}
