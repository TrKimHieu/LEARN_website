import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { newId, hashPassword, verifyPassword } from '@learn/db';
import type { RegisterInput, LoginInput, PatchMeInput, UserPublic } from '@learn/contracts';
import { ApiError } from '../../common/errors';
import { SecurityService } from '../../common/security';
import { PrismaService } from '../../common/services';
import { env } from '../../environment';
import { UsageService } from '../subscriptions/usage.service';
import { SubscriptionRepository } from '../subscriptions/subscription.repository';
import { PlanRepository } from '../subscriptions/plan.repository';
import { UserRepository } from './user.repository';
import { RefreshTokenRepository } from './refresh-token.repository';

const DAY_MS = 86_400_000;

/**
 * Hash argon2id của một mật khẩu không ai dùng, tính một lần lúc khởi động.
 *
 * Dùng để so mật khẩu khi **email không tồn tại**. Nếu bỏ qua bước xác minh trong trường hợp
 * đó — như bản trước — thì đăng nhập với email lạ trả về sau ~1ms, còn email có thật mất
 * ~100ms vì phải chạy argon2. Chênh lệch đó đo được từ bên ngoài và biến form đăng nhập
 * thành công cụ dò xem một email đã đăng ký hay chưa. Chạy verify giả làm hai nhánh tốn
 * thời gian như nhau.
 */
const dummyHashPromise = hashPassword(randomBytes(32).toString('base64url'));

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly subscriptions: SubscriptionRepository,
    private readonly plans: PlanRepository,
    private readonly prisma: PrismaService,
    private readonly security: SecurityService,
    private readonly usage: UsageService,
  ) {}

  async register(input: RegisterInput, ip?: string) {
    const passwordHash = await hashPassword(input.password);

    // `findByEmail` rồi `create` là kiểm-tra-rồi-ghi: hai lượt đăng ký cùng email trong cùng
    // khoảnh khắc đều thấy "chưa tồn tại" và cùng INSERT. Ràng buộc unique trên `User.email`
    // mới là thứ quyết định; bắt P2002 ở đây để lượt thua vẫn nhận 409 thay vì 500.
    const user = await this.users
      .create({
        email: input.email,
        passwordHash,
        displayName: input.displayName,
        locale: input.locale,
      })
      .catch((e: unknown) => {
        if (isUniqueViolation(e)) throw ApiError.conflict('Email đã được đăng ký.');
        throw e;
      });

    // Gắn gói mặc định FREE cho người dùng mới (HANDBOOK §11).
    await this.ensureSubscription(user.id);

    const accessToken = await this.security.signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    const { token, hashed } = this.issueRefreshToken(user.id, ip);
    await this.refreshTokens.create(hashed);

    return { user: toPublic(user), accessToken, refreshToken: token };
  }

  async login(input: LoginInput, userAgent?: string, ip?: string) {
    const user = await this.users.findByEmail(input.email);
    // Luôn chạy verify — kể cả khi không có user — để thời gian phản hồi không tiết lộ
    // email nào đã đăng ký. Xem `dummyHashPromise`.
    const valid = await safeVerify(user?.passwordHash ?? (await dummyHashPromise), input.password);
    if (!user || !valid) throw ApiError.unauthenticated('Email hoặc mật khẩu không đúng.');

    const accessToken = await this.security.signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    const { token, hashed } = this.issueRefreshToken(user.id, ip, userAgent);
    await this.refreshTokens.create(hashed);

    return { user: toPublic(user), accessToken, refreshToken: token };
  }

  async refresh(rawToken: string, userAgent?: string, ip?: string) {
    const tokenHash = hashToken(rawToken);
    const stored = await this.refreshTokens.findByHash(tokenHash);
    if (!stored) throw ApiError.unauthenticated();

    if (stored.revokedAt) {
      // Tái sử dụng token đã thu hồi → thu hồi cả family (HANDBOOK §10.1)
      await this.refreshTokens.revokeFamily(stored.familyId);
      throw ApiError.unauthenticated('Phiên đã hết hạn, vui lòng đăng nhập lại.');
    }
    if (stored.expiresAt < new Date()) {
      await this.refreshTokens.revokeById(stored.id);
      throw ApiError.unauthenticated();
    }

    const user = await this.users.findById(stored.userId);
    if (!user) throw ApiError.unauthenticated();

    // Xoay vòng: tạo token mới cùng family, thu hồi token cũ.
    const next = this.issueRefreshToken(user.id, ip, userAgent, stored.familyId);
    await this.prisma.client.$transaction(async (tx) => {
      await this.refreshTokens.revokeById(stored.id, tx);
      await this.refreshTokens.create(next.hashed, tx);
    });

    const accessToken = await this.security.signAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });
    return { user: toPublic(user), accessToken, refreshToken: next.token };
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw ApiError.notFound();

    const [subscription, usage] = await Promise.all([
      this.subscriptions.findFirstWithPlan(userId),
      // Trước đây trả `usage: {}` cứng, nên dải hạn mức trong Settings không bao giờ có số.
      this.usage.snapshot(userId),
    ]);

    return {
      user: toPublic(user),
      plan: { code: subscription?.plan.code ?? 'FREE', name: subscription?.plan.name ?? 'Free' },
      usage,
    };
  }

  async patchMe(userId: string, body: PatchMeInput) {
    const user = await this.users.update(userId, body);
    return { user: toPublic(user) };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.users.findById(userId);
    if (!user) throw ApiError.notFound();
    const ok = await safeVerify(user.passwordHash, currentPassword);
    // 401, không phải 403: người gọi đã đăng nhập nhưng chưa chứng minh được danh tính cho
    // thao tác nhạy cảm này. 403 nghĩa là "đã biết bạn là ai và bạn không được phép".
    if (!ok) throw ApiError.unauthenticated('Mật khẩu hiện tại không đúng.');
    const passwordHash = await hashPassword(newPassword);

    // Đổi hash + thu hồi mọi phiên khác trong CÙNG một transaction — đổi mật khẩu thành
    // công nhưng token cũ vẫn sống nếu câu thứ hai lỗi là lỗ hổng.
    await this.prisma.client.$transaction(async (tx) => {
      await this.users.updatePasswordHash(userId, passwordHash, tx);
      await this.refreshTokens.revokeAllForUser(userId, tx);
    });
  }

  async revokeToken(rawToken: string) {
    await this.refreshTokens.revokeByTokenHash(hashToken(rawToken));
  }

  async revokeAllForUser(userId: string) {
    await this.refreshTokens.revokeAllForUser(userId);
  }

  /** Sinh refresh token mới. Thuần đồng bộ — không có gì để `await`. */
  private issueRefreshToken(
    userId: string,
    ip?: string,
    userAgent?: string,
    familyId?: string,
  ): {
    token: string;
    hashed: {
      id: string;
      userId: string;
      tokenHash: string;
      familyId: string;
      expiresAt: Date;
      ipAddress?: string;
      userAgent?: string;
    };
  } {
    const token = randomBytes(32).toString('base64url');
    const id = newId();
    return {
      token,
      hashed: {
        id,
        userId,
        tokenHash: hashToken(token),
        familyId: familyId ?? id,
        // Trước đây hardcode 30 ngày ở ba chỗ, trong khi `REFRESH_TOKEN_TTL_DAYS` được khai
        // báo và validate nhưng không ai đọc — đổi biến môi trường không có tác dụng gì.
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
        ipAddress: ip,
        userAgent,
      },
    };
  }

  private async ensureSubscription(userId: string) {
    const freePlan = await this.plans.findFree();
    if (!freePlan) return;
    const now = new Date();
    await this.subscriptions.create({
      userId,
      planId: freePlan.id,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * DAY_MS),
    });
  }
}

const isUniqueViolation = (e: unknown): boolean =>
  !!e && typeof e === 'object' && (e as { code?: unknown }).code === 'P2002';

/**
 * `verify` của @node-rs/argon2 **ném lỗi** khi chuỗi hash dị dạng thay vì trả `false`.
 * Một dòng User có hash hỏng (nhập liệu thủ công, migrate lỗi) sẽ biến đăng nhập thành 500.
 */
async function safeVerify(hash: string, password: string): Promise<boolean> {
  try {
    return await verifyPassword(hash, password);
  } catch {
    return false;
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function toPublic(user: {
  id: string;
  email: string;
  displayName: string;
  role: 'LEARNER' | 'ADMIN';
  locale: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    locale: user.locale as 'vi' | 'en',
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
