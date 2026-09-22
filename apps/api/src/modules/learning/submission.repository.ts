import { Injectable } from '@nestjs/common';
import { newId } from '@learn/db';
import type { Prisma } from '@learn/db';
import { PrismaService, type Db } from '../../common/services';

@Injectable()
export class SubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Lượt nộp mới nhất của người dùng cho một bài tập — trả `null` khi chưa nộp lần nào. */
  findBest(userId: string, exerciseId: string, db: Db = this.prisma.client) {
    return db.submission.findFirst({
      where: { userId, exerciseId },
      orderBy: { attemptNo: 'desc' },
    });
  }

  /** Lượt nộp kế tiếp — tính TRONG transaction để hai nộp song song không đụng `@@unique`. */
  maxAttemptNo(userId: string, exerciseId: string, tx: Prisma.TransactionClient) {
    return tx.submission.aggregate({
      where: { userId, exerciseId },
      _max: { attemptNo: true },
    });
  }

  /**
   * Ghi Submission + SubmissionAnswer trong MỘT transaction.
   *
   * `attemptNo` tính từ `_max` thật trong transaction; nếu đụng khoá (P2002) service thử lại.
   */
  async createWithAnswers(
    tx: Prisma.TransactionClient,
    args: {
      userId: string;
      exerciseId: string;
      percent: number;
      maxScore: number;
      durationMs: number | null;
      results: Array<{
        questionId: string;
        rawAnswer: Prisma.InputJsonValue;
        isCorrect: boolean;
        pointsEarned: number;
        explanation: string | null;
      }>;
    },
  ): Promise<{ id: string; attemptNo: number; createdAt: Date }> {
    const previous = await this.maxAttemptNo(args.userId, args.exerciseId, tx);
    const attemptNo = (previous._max.attemptNo ?? 0) + 1;
    const id = newId();

    const submission = await tx.submission.create({
      data: {
        id,
        userId: args.userId,
        exerciseId: args.exerciseId,
        attemptNo,
        score: args.percent,
        maxScore: args.maxScore,
        durationMs: args.durationMs,
      },
    });

    // Một INSERT nhiều dòng thay cho N round-trip tuần tự trong transaction.
    await tx.submissionAnswer.createMany({
      data: args.results.map((r) => ({
        id: newId(),
        submissionId: id,
        questionId: r.questionId,
        rawAnswer: r.rawAnswer,
        isCorrect: r.isCorrect,
        pointsEarned: r.pointsEarned,
        feedback: r.explanation,
      })),
    });

    return { id, attemptNo, createdAt: submission.createdAt };
  }

  /** Trung bình điểm (0-100) của một người — aggregate trong Postgres. */
  averageForUser(userId: string, db: Db = this.prisma.client) {
    return db.submission.aggregate({ where: { userId }, _avg: { score: true } });
  }

  /** Lịch sử nộp gần nhất kèm tên bài tập/bài học/khoá học. */
  recent(userId: string, limit: number, db: Db = this.prisma.client) {
    return db.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        exercise: {
          select: {
            title: true,
            lesson: { select: { title: true, course: { select: { title: true } } } },
          },
        },
      },
    });
  }

  /**
   * Các ngày (theo giờ địa phương) người dùng có lượt nộp — đầu vào tính chuỗi ngày liên tiếp.
   * `date_trunc` chạy trong Postgres; cửa sổ nhìn lại chặn cứng để không tải toàn bộ lịch sử.
   * Logic múi giờ được giải thích trong ProgressService.activeStreak.
   */
  distinctStudyDays(
    userId: string,
    since: Date,
    timeZone: string,
    limit: number,
    db: Db = this.prisma.client,
  ) {
    return db.$queryRaw<Array<{ day: Date }>>`
      SELECT DISTINCT date_trunc('day', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${timeZone}) AS day
      FROM "Submission"
      WHERE "userId" = ${userId} AND "createdAt" >= ${since}
      ORDER BY day DESC
      LIMIT ${limit}
    `;
  }
}
