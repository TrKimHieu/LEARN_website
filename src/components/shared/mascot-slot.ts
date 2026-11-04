/**
 * Mỗi màn hình chỉ có một mascot. Mọi `Mascot` đang gắn đăng ký ở đây, chỉ một cái được hiện.
 *
 * Mascot báo trạng thái (trống, lỗi, AI đang chạy, kết quả) thắng mascot đồng hành (đầu trang, lời
 * động viên), vì nó đang nói điều người dùng cần biết. Cùng loại thì cái gắn trước thắng.
 */
export type MascotRole = 'state' | 'companion';

type Entry = { id: string; role: MascotRole };

let entries: Entry[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

/** Đăng ký một mascot, trả về hàm huỷ đăng ký. */
export function claimMascot(id: string, role: MascotRole) {
  entries = [...entries, { id, role }];
  emit();
  return () => {
    entries = entries.filter((entry) => entry.id !== id);
    emit();
  };
}

export function subscribeMascot(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function currentMascot(): string | null {
  const winner = entries.find((entry) => entry.role === 'state') ?? entries[0];
  return winner?.id ?? null;
}
