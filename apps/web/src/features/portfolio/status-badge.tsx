import type { FeatureLabel } from '@learn/ui';
import { useLang } from '@/features/portfolio/portfolio-language';

const EN_LABEL: Record<FeatureLabel, string> = {
  'Có trong MVP': 'Available in MVP',
  'Đang phát triển': 'In development',
  'Đã lên kế hoạch': 'Planned',
  'Mở rộng tương lai': 'Future extension',
};

const STYLE: Record<FeatureLabel, string> = {
  'Có trong MVP': 'bg-success-50 text-success-700',
  'Đang phát triển': 'bg-sky-50 text-sky-700',
  'Đã lên kế hoạch': 'bg-warning-50 text-warning-700',
  'Mở rộng tương lai': 'bg-surface-200 text-ink-500',
};

export function StatusBadge({ label }: { label: FeatureLabel }) {
  const lang = useLang();
  return (
    <span className={`rounded-pill px-2.5 py-1 text-xs font-bold ${STYLE[label]}`}>
      {lang === 'vi' ? label : EN_LABEL[label]}
    </span>
  );
}
