const MAX_SHOWN = 99;

/** Nhãn số thẻ đến hạn trên điều hướng; `null` khi không có gì để nhắc. */
export function dueBadgeLabel(count: number | undefined): string | null {
  if (!count || count < 1) return null;
  return count > MAX_SHOWN ? `${MAX_SHOWN}+` : String(count);
}

export function dueSummaryText(count: number): string {
  return count === 0 ? 'Chưa có thẻ đến hạn' : `${count} thẻ đến hạn`;
}
