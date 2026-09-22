'use client';

import { useState } from 'react';
import {
  usePlans,
  useSubscription,
  useCheckout,
  useCancelSubscription,
} from '@/lib/subscription-api';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Icon,
  PageHeader,
  ProgressBar,
  Skeleton,
  cn,
} from '@/components/ui';
import { ErrorState, PartialNotice } from '@/components/ui/states';
import { ApiClientError } from '@/lib/api-client';
import { humanizeCode } from '@/lib/humanize';

/**
 * Nhãn tiếng Việt cho các enum của API.
 *
 * `status` và `interval` là mã máy đọc do backend định nghĩa; đổ thẳng ra màn
 * hình thì người dùng đọc được "ACTIVE" và "$9/month" giữa một giao diện tiếng
 * Việt — NN/g gọi là vi phạm "match between the system and the real world":
 * giao diện phải nói ngôn ngữ của người dùng, không phải từ vựng nội bộ của hệ
 * thống. Không khớp thì `humanizeCode` đỡ: mã mới của backend vẫn hiện ra (biến
 * mất thì còn tệ hơn) nhưng ở dạng đọc được — `PAST_DUE` thành "Past due".
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
  PAGES_PROCESSED: 'Trang / tài liệu',
  AI_JOBS_RUN: 'AI Job / tháng',
};

export default function SettingsPage() {
  const plans = usePlans();
  const subscription = useSubscription();
  const checkout = useCheckout();
  const cancelSubscription = useCancelSubscription();
  const [actionError, setActionError] = useState<string | null>(null);
  const [upgradingCode, setUpgradingCode] = useState<string | null>(null);

  async function handleUpgrade(planCode: string) {
    setActionError(null);
    setUpgradingCode(planCode);
    try {
      await checkout.mutateAsync(planCode);
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : 'Không nâng cấp được gói, vui lòng thử lại.',
      );
    } finally {
      setUpgradingCode(null);
    }
  }

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelSubscription.mutateAsync();
    } catch (err) {
      setActionError(
        err instanceof ApiClientError ? err.message : 'Không huỷ được gói, vui lòng thử lại.',
      );
    }
  }

  if (plans.isLoading || subscription.isLoading) {
    return (
      <section>
        <PageHeader title="Cài đặt" />
        <Skeleton className="h-40" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </section>
    );
  }

  if (plans.isError || subscription.isError || !plans.data || !subscription.data) {
    const err = plans.error ?? subscription.error;
    return (
      <section>
        <PageHeader title="Cài đặt" />
        <ErrorState
          title="Không tải được thông tin gói"
          description={err instanceof ApiClientError ? err.message : 'Vui lòng thử lại.'}
          onRetry={() => {
            void plans.refetch();
            void subscription.refetch();
          }}
        />
      </section>
    );
  }

  const sub = subscription.data;

  return (
    <section>
      <PageHeader title="Cài đặt" description="Gói đăng ký và hạn mức sử dụng." />

      {sub.billingMode === 'demo' && (
        <PartialNotice>
          <b>Chế độ demo</b> — nâng cấp gói ở đây không phát sinh giao dịch thật, chỉ để minh hoạ
          luồng sản phẩm.
        </PartialNotice>
      )}

      {/* ------------------------------------------------- gói hiện tại */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-ink-500">Gói hiện tại</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{sub.planCode}</p>
          </div>
          <div className="text-right">
            <Badge
              tone={sub.status === 'ACTIVE' || sub.status === 'TRIALING' ? 'success' : 'warning'}
            >
              {STATUS_LABEL[sub.status] ?? humanizeCode(sub.status)}
            </Badge>
            {sub.currentPeriodEnd && (
              <p className="mt-1.5 text-xs text-ink-500">
                {sub.cancelAtPeriodEnd ? 'Huỷ vào' : 'Gia hạn vào'}{' '}
                {new Date(sub.currentPeriodEnd).toLocaleDateString('vi-VN')}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Object.entries(sub.usage).map(([metric, u]) => {
            const atLimit = u.limit !== null && u.used >= u.limit;
            return (
              <div key={metric}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-ink-700">{METRIC_LABEL[metric] ?? metric}</span>
                  <span
                    className={cn(
                      'text-xs font-bold tabular-nums',
                      atLimit ? 'text-danger-700' : 'text-ink-500',
                    )}
                  >
                    {u.used}
                    {u.limit !== null ? ` / ${u.limit}` : ' (không giới hạn)'}
                  </span>
                </div>
                {u.limit !== null && (
                  <ProgressBar
                    size="sm"
                    value={u.used}
                    max={u.limit}
                    label={`${METRIC_LABEL[metric] ?? metric}: ${u.used} trên ${u.limit}`}
                  />
                )}
                {atLimit && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger-700">
                    <Icon name="alert" size={12} />
                    Đã chạm hạn mức
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {sub.planCode !== 'FREE' && !sub.cancelAtPeriodEnd && (
          <div className="mt-5 border-t-2 border-surface-200 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleCancel()}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? 'Đang huỷ…' : 'Huỷ gói (hiệu lực cuối kỳ)'}
            </Button>
          </div>
        )}
        {sub.cancelAtPeriodEnd && (
          <p className="mt-5 border-t-2 border-surface-200 pt-4 text-sm text-ink-500">
            Gói sẽ huỷ ở cuối kỳ hiện tại.
          </p>
        )}
      </Card>

      {actionError && (
        <p
          role="alert"
          className="mt-4 rounded-card bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
        >
          {actionError}
        </p>
      )}

      {/* ------------------------------------------------------ các gói */}
      <h2 className="mb-3 mt-10 text-lg font-bold text-ink-900">Các gói</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.data.map((plan) => {
          const current = plan.code === sub.planCode;
          return (
            <Card
              key={plan.code}
              className={cn('flex flex-col', current && 'border-sky-500 bg-sky-50/40')}
            >
              <div className="flex items-start justify-between gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {plan.isFutureExtension && <Badge tone="neutral">Mở rộng tương lai</Badge>}
                {current && !plan.isFutureExtension && (
                  <Badge tone="info" icon="check">
                    Đang dùng
                  </Badge>
                )}
              </div>

              {/* Gói "mở rộng tương lai" có priceCents = 0 làm chỗ giữ chỗ, không
                  phải vì nó miễn phí — hiện "Miễn phí" ở đây là nói sai. */}
              <p className="mt-2 text-3xl font-bold text-ink-900">
                {plan.isFutureExtension ? (
                  <span className="text-2xl text-ink-500">Chưa công bố</span>
                ) : (
                  <>
                    {plan.priceCents === 0 ? 'Miễn phí' : `$${(plan.priceCents / 100).toFixed(0)}`}
                    {/* ink-500 ở đây chỉ đạt 4.49:1 trên nền thẻ gói nổi bật —
                        dưới ngưỡng AA 4.5:1 (đo bằng axe). ink-700 = 9.77:1. */}
                    {plan.priceCents > 0 && (
                      <span className="text-sm font-bold text-ink-700">
                        /{INTERVAL_LABEL[plan.interval] ?? humanizeCode(plan.interval)}
                      </span>
                    )}
                  </>
                )}
              </p>

              <ul className="mt-4 space-y-1.5 text-sm text-ink-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-success-700">
                      <Icon name="check" size={14} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-5">
                {current ? (
                  <p className="text-center text-sm font-bold text-ink-700">Gói hiện tại</p>
                ) : plan.isFutureExtension ? (
                  <Button variant="secondary" fullWidth disabled>
                    Chưa mở bán
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    onClick={() => void handleUpgrade(plan.code)}
                    disabled={upgradingCode !== null}
                  >
                    {upgradingCode === plan.code ? 'Đang xử lý…' : 'Chọn gói này'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
