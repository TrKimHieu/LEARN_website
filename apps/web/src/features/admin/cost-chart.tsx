'use client';

import { useState } from 'react';
import type { AiCostMetrics } from '@learn/contracts';
import { cn } from '@/components/ui/cn';

/**
 * Chi phí LLM theo ngày — cột dọc, MỘT chuỗi (theo skill dataviz):
 * - Một chuỗi → không hộp chú giải; tiêu đề mục đã gọi tên nó.
 * - Màu `chart-1` (sky) đã qua `validate_palette.js`: dải sáng + ≥ 3:1 với `panel` ở cả
 *   hai tông. Chữ luôn mang token chữ, không mang màu cột.
 * - Cột mảnh, đầu bo 4px, neo vào đường gốc; khoảng hở giữa các cột.
 * - Di chuột/focus một cột → tooltip. Vùng bấm là cả cột dọc, lớn hơn chính cột.
 * - Bảng số liệu nằm ngay dưới (`sr-only` + `<details>` cho người nhìn), nên thông tin
 *   không bao giờ chỉ nằm trong hình.
 */
export function CostChart({ data }: { data: AiCostMetrics }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.totalCostUsd), 0.0001);
  const peak = data.reduce(
    (best, d, i) => (d.totalCostUsd > data[best]!.totalCostUsd ? i : best),
    0,
  );

  const total = data.reduce((sum, d) => sum + d.totalCostUsd, 0);

  return (
    <figure>
      <figcaption className="sr-only">
        Tổng {data.length} ngày: ${total.toFixed(4)}. Cao nhất ngày {data[peak]?.date}: $
        {data[peak]?.totalCostUsd.toFixed(4)}. Mở &quot;Xem dạng bảng&quot; để đọc từng ngày.
      </figcaption>
      <div className="relative h-56" aria-hidden="true">
        {/* Lưới ngang mờ — lùi hẳn ra sau. */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <div
            key={f}
            className="absolute inset-x-0 border-t border-dashed border-line"
            style={{ bottom: `${f * 100}%` }}
          />
        ))}
        <div className="absolute inset-0 flex items-end gap-[2px] border-b border-line-strong">
          {data.map((d, i) => {
            const h = (d.totalCostUsd / max) * 100;
            const isActive = active === i;
            return (
              <div
                key={d.date}
                className="group relative flex h-full flex-1 cursor-default items-end justify-center"
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
              >
                <div
                  className={cn(
                    'w-full max-w-10 rounded-t-[4px] bg-chart-1 transition-opacity duration-150',
                    active !== null && !isActive && 'opacity-45',
                  )}
                  style={{ height: `${Math.max(h, d.totalCostUsd > 0 ? 2 : 0)}%` }}
                />
                {/* Nhãn trực tiếp chọn lọc: chỉ cột cao nhất, không phải mọi cột. */}
                {i === peak && d.totalCostUsd > 0 && active === null && (
                  <span
                    className="absolute -translate-y-1 text-2xs font-semibold tabular-nums text-fg-muted"
                    style={{ bottom: `${h}%` }}
                  >
                    ${d.totalCostUsd.toFixed(4)}
                  </span>
                )}
                {isActive && (
                  <div
                    className="pointer-events-none absolute z-10 w-max -translate-y-2 rounded-control border border-line bg-panel px-3 py-2 text-left shadow-overlay"
                    style={{ bottom: `${h}%` }}
                  >
                    <p className="text-xs font-semibold text-fg-subtle">{d.date}</p>
                    <p className="text-sm font-semibold tabular-nums text-fg">
                      ${d.totalCostUsd.toFixed(4)}
                    </p>
                    <p className="text-xs tabular-nums text-fg-subtle">{d.jobCount} job</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-[2px]" aria-hidden="true">
        {data.map((d) => (
          <span
            key={d.date}
            className="flex-1 truncate text-center text-2xs font-medium tabular-nums text-fg-subtle"
          >
            {d.date.slice(5)}
          </span>
        ))}
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer rounded-md text-xs font-semibold text-accent underline underline-offset-2 focus-ring">
          Xem dạng bảng
        </summary>
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Chi phí LLM theo ngày</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-subtle">
              <th scope="col" className="py-2 font-semibold">
                Ngày
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Chi phí (USD)
              </th>
              <th scope="col" className="py-2 text-right font-semibold">
                Số job
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {data.map((d) => (
              <tr key={d.date}>
                <td className="py-2 tabular-nums text-fg-muted">{d.date}</td>
                <td className="py-2 text-right font-semibold tabular-nums text-fg">
                  ${d.totalCostUsd.toFixed(4)}
                </td>
                <td className="py-2 text-right tabular-nums text-fg-muted">{d.jobCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
