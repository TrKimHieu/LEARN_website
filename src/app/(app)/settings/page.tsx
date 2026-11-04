'use client';

import { useState } from 'react';
import {
  usePlans,
  useSubscription,
  useCheckout,
  useCancelSubscription,
} from '@/features/settings/subscription-api';
import { useAuth } from '@/features/auth/auth-context';
import { Avatar } from '@/features/shell/user-menu';
import { ThemeSegmented } from '@/components/shared/theme-toggle';
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Icon,
  InlineError,
  PageHeader,
  PartialNotice,
  ProgressBar,
  SectionTitle,
  Skeleton,
  cn,
} from '@/components/ui';
import { errorDetail, errorText } from '@/lib/api-client';
import { humanizeCode } from '@/lib/humanize';
import { planLabel } from '@/features/settings/plan-label';
import { usePageTitle } from '@/lib/use-page-title';

/**
 * Nhãn tiếng Việt cho enum của API — không đổ mã máy ("ACTIVE", "/month") ra màn hình
 * (NN/g H2). Mã mới của backend đi qua `humanizeCode` thay vì lọt ra thô.
 */
const STATUS_LABEL: Record<string, string> = {
  TRIALING: 'Đang dùng thử',
  ACTIVE: 'Đang hoạt động',
  PAST_DUE: 'Quá hạn thanh toán',
  CANCELED: 'Đã huỷ',
};

const INTERVAL_LABEL: Record<string, string> = {
  month: 'tháng',
  year: 'năm',
  week: 'tuần',
  day: 'ngày',
};

const METRIC_LABEL: Record<string, string> = {
  COURSES_CREATED: 'Khóa học',
  DOCUMENTS_UPLOADED: 'Tài liệu / tháng',
  AI_JOBS_RUN: 'Lượt sinh AI / tháng',
};

const ROLE_LABEL: Record<string, string> = {
  LEARNER: 'Người học',
  ADMIN: 'Quản trị viên',
};

export default function SettingsPage() {
  usePageTitle('Cài đặt');
  const { user, logoutAll } = useAuth();
  const plans = usePlans();
  const subscription = useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();
  const [actionError, setActionError] = useState<string | null>(null);
  const [upgradingCode, setUpgradingCode] = useState<string | null>(null);
  // Huỷ gói xác nhận 2 nhịp, cùng mẫu với "Xoá bài học" — cùng mức hậu quả, cùng mẫu.
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  async function handleUpgrade(planCode: string) {
    setActionError(null);
    setUpgradingCode(planCode);
    try {
      await checkout.mutateAsync(planCode);
    } catch (err) {
      setActionError(errorText(err, 'Không nâng cấp được gói, vui lòng thử lại.'));
    } finally {
      setUpgradingCode(null);
    }
  }

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelSubscription.mutateAsync();
      setConfirmingCancel(false);
    } catch (err) {
      setActionError(errorText(err, 'Không huỷ được gói, vui lòng thử lại.'));
    }
  }

  const sub = subscription.data;

  return (
    <div>
      <PageHeader title="Cài đặt" description="Hồ sơ, giao diện, gói đăng ký và hạn mức sử dụng." />

      {/* ------------------------------------------- hồ sơ + giao diện */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.displayName} className="size-14 text-xl" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-fg">{user?.displayName}</p>
              <p className="truncate text-sm text-fg-subtle">{user?.email}</p>
              {user?.role && (
                <Badge
                  tone={user.role === 'ADMIN' ? 'info' : 'neutral'}
                  icon={user.role === 'ADMIN' ? 'shield' : 'user'}
                  className="mt-2"
                >
                  {ROLE_LABEL[user.role] ?? humanizeCode(user.role)}
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-fg-subtle">Đăng xuất khỏi mọi trình duyệt đang đăng nhập.</p>
            <Button
              variant="ghost"
              size="sm"
              className="text-bad hover:bg-bad-soft hover:text-bad"
              onClick={() => void logoutAll()}
            >
              <Icon name="logout" size={15} />
              Đăng xuất mọi thiết bị
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-fg">Giao diện</h2>
          <p className="mt-1 text-sm text-fg-subtle">
            &quot;Tự động&quot; theo chế độ sáng/tối của thiết bị. Lựa chọn được lưu trên trình
            duyệt này.
          </p>
          <ThemeSegmented className="mt-4" />
        </Card>
      </div>

      {/* ------------------------------------------------- gói hiện tại */}
      <section aria-labelledby="plan-title" className="mt-12">
        <SectionTitle id="plan-title">Gói hiện tại</SectionTitle>

        {subscription.isLoading && <Skeleton className="h-48 rounded-card" />}

        {/* Hai truy vấn độc lập — lỗi một cái không xoá cả trang. */}
        {!subscription.isLoading && (subscription.isError || !sub) && (
          <ErrorState
            title="Không tải được thông tin gói hiện tại"
            description={errorText(subscription.error, 'Vui lòng thử lại.')}
            detail={errorDetail(subscription.error)}
            onRetry={() => void subscription.refetch()}
          />
        )}

        {sub && (
          <>
            {sub.billingMode === 'demo' && (
              <PartialNotice className="mb-4">
                <b>Chế độ demo:</b> nâng cấp gói ở đây không phát sinh giao dịch thật, chỉ để minh
                hoạ luồng sản phẩm.
              </PartialNotice>
            )}

            <Card padded={false} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-6 py-5">
                <div>
                  <p className="text-sm text-fg-subtle">Gói của bạn</p>
                  <p className="mt-0.5 text-3xl font-semibold text-fg">{planLabel(sub.planCode)}</p>
                </div>
                <div className="text-right">
                  <Badge
                    tone={
                      sub.status === 'ACTIVE' || sub.status === 'TRIALING' ? 'success' : 'warning'
                    }
                    icon={sub.status === 'ACTIVE' ? 'check' : undefined}
                  >
                    {STATUS_LABEL[sub.status] ?? humanizeCode(sub.status)}
                  </Badge>
                  {sub.currentPeriodEnd && sub.planCode !== 'FREE' && (
                    <p className="mt-1.5 text-xs text-fg-subtle">
                      {sub.cancelAtPeriodEnd ? 'Huỷ vào' : 'Gia hạn vào'}{' '}
                      {new Date(sub.currentPeriodEnd).toLocaleDateString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                {Object.entries(sub.usage).map(([metric, u]) => {
                  // Giới hạn theo từng tài liệu, không có số đã dùng để đo.
                  if (u.window === 'per_document') {
                    return (
                      <div key={metric} className="text-sm">
                        <p className="font-semibold text-fg-muted">Số trang mỗi tài liệu</p>
                        <p className="mt-1.5 text-xs text-fg-subtle">
                          {u.limit !== null ? `Tối đa ${u.limit} trang` : 'Không giới hạn'}
                        </p>
                      </div>
                    );
                  }
                  const atLimit = u.limit !== null && u.used >= u.limit;
                  const name = METRIC_LABEL[metric] ?? humanizeCode(metric);
                  return (
                    <div key={metric}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-semibold text-fg-muted">{name}</span>
                        <span
                          className={cn(
                            'text-xs font-semibold tabular-nums',
                            atLimit ? 'text-bad' : 'text-fg-subtle',
                          )}
                        >
                          {u.used}
                          {u.limit !== null ? ` / ${u.limit}` : ' · không giới hạn'}
                        </span>
                      </div>
                      {u.limit !== null ? (
                        <ProgressBar
                          size="sm"
                          value={u.used}
                          max={u.limit}
                          label={`${name}: ${u.used} trên ${u.limit}`}
                        />
                      ) : (
                        <div className="h-2 rounded-pill bg-[repeating-linear-gradient(90deg,var(--track)_0_6px,transparent_6px_10px)]" />
                      )}
                      {atLimit && (
                        <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-bad">
                          <Icon name="alert" size={12} />
                          Đã chạm hạn mức
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {sub.planCode !== 'FREE' && !sub.cancelAtPeriodEnd && (
                <div className="flex flex-wrap items-center gap-2 border-t border-line px-6 py-4">
                  {!confirmingCancel ? (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmingCancel(true)}>
                      Huỷ gói (hiệu lực cuối kỳ)
                    </Button>
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-fg">Huỷ gói này?</span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleCancel()}
                        loading={cancelSubscription.isPending}
                      >
                        {cancelSubscription.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmingCancel(false)}
                        disabled={cancelSubscription.isPending}
                      >
                        Không huỷ
                      </Button>
                    </>
                  )}
                </div>
              )}
              {sub.cancelAtPeriodEnd && (
                <p className="border-t border-line px-6 py-4 text-sm text-fg-subtle">
                  Gói sẽ huỷ ở cuối kỳ hiện tại.
                </p>
              )}
            </Card>
          </>
        )}

        {actionError && <InlineError className="mt-4">{actionError}</InlineError>}
      </section>

      {/* ------------------------------------------------------ các gói */}
      <section aria-labelledby="plans-title" className="mt-12">
        <SectionTitle id="plans-title">Các gói</SectionTitle>

        {plans.isLoading && (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-80 rounded-card" />
            ))}
          </div>
        )}

        {!plans.isLoading && (plans.isError || !plans.data) && (
          <ErrorState
            title="Không tải được danh sách gói"
            description={errorText(plans.error, 'Vui lòng thử lại.')}
            detail={errorDetail(plans.error)}
            onRetry={() => void plans.refetch()}
          />
        )}

        {plans.data && (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.data.map((plan) => {
              // `sub` có thể chưa có khi truy vấn subscription lỗi — khi đó không tô gói nào.
              const current = sub ? plan.code === sub.planCode : false;
              return (
                <Card
                  key={plan.code}
                  className={cn(
                    'relative flex flex-col',
                    current && 'border-fg ring-1 ring-fg',
                    plan.isFutureExtension && 'border-dashed',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-fg">{plan.name}</h3>
                    {plan.isFutureExtension && <Badge tone="neutral">Mở rộng tương lai</Badge>}
                    {current && !plan.isFutureExtension && (
                      <Badge tone="info" icon="check">
                        Đang dùng
                      </Badge>
                    )}
                  </div>

                  {/* Gói "mở rộng tương lai" có priceCents = 0 làm chỗ giữ chỗ, không phải
                      vì miễn phí — hiện "Miễn phí" là nói sai. */}
                  <p className="mt-3 text-4xl font-semibold text-fg">
                    {plan.isFutureExtension ? (
                      <span className="text-3xl text-fg-subtle">Chưa công bố</span>
                    ) : (
                      <>
                        {plan.priceCents === 0
                          ? 'Miễn phí'
                          : `$${(plan.priceCents / 100).toFixed(0)}`}
                        {plan.priceCents > 0 && (
                          <span className="font-sans text-sm font-medium text-fg-muted">
                            {' '}
                            / {INTERVAL_LABEL[plan.interval] ?? humanizeCode(plan.interval)}
                          </span>
                        )}
                      </>
                    )}
                  </p>

                  <ul className="mt-5 space-y-2.5 border-t border-line pt-5 text-sm text-fg-muted">
                    {plan.features
                      .map((feature) => feature.replace('AI job', 'lượt sinh AI'))
                      .map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <Icon name="check" size={16} className="mt-0.5 shrink-0 text-ok" />
                          {f}
                        </li>
                      ))}
                  </ul>

                  <div className="mt-auto pt-6">
                    {current ? (
                      <p className="flex h-10 items-center justify-center gap-1.5 rounded-control bg-accent-soft text-sm font-semibold text-accent">
                        <Icon name="check" size={15} />
                        Gói hiện tại
                      </p>
                    ) : plan.isFutureExtension ? (
                      <Button variant="secondary" fullWidth disabled>
                        Chưa mở bán
                      </Button>
                    ) : (
                      <Button
                        variant={plan.priceCents > 0 ? 'primary' : 'secondary'}
                        fullWidth
                        onClick={() => void handleUpgrade(plan.code)}
                        loading={upgradingCode === plan.code}
                        disabled={upgradingCode !== null && upgradingCode !== plan.code}
                      >
                        {upgradingCode === plan.code ? 'Đang xử lý…' : 'Chọn gói này'}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
