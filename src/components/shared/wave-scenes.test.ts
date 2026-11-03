import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  SCREENS,
  crestPoints,
  fallbackIndex,
  sceneFor,
  sceneIndex,
  sceneKeyForPath,
  sceneSignature,
} from './wave-scenes';

/**
 * Ràng buộc của chủ sản phẩm (2026-10-13): hai màn hình không được có cùng hình nền. Test này là
 * chốt chặn — thêm một `page.tsx` mới mà quên đăng ký cảnh ở `SCREENS` thì đỏ ngay, thay vì lặng lẽ
 * mượn cảnh dự phòng.
 */

const APP_DIR = fileURLToPath(new URL('../../app', import.meta.url));

/** Mọi `page.tsx` thành một đường dẫn mẫu: bỏ nhóm `(auth)`, thay `[id]` bằng giá trị giả. */
function samplePaths(): string[] {
  return (
    readdirSync(APP_DIR, { recursive: true, encoding: 'utf8' })
      .filter((f) => path.basename(f) === 'page.tsx')
      .map((f) => {
        const segs = path
          .dirname(f)
          .split(path.sep)
          .filter((s) => s !== '.' && !/^\(.*\)$/.test(s))
          .map((s) => (/^\[.*\]$/.test(s) ? 'x1' : s));
        return `/${segs.join('/')}`;
      })
      // `/` chỉ redirect; `/dev/ui` là bảng mẫu nội bộ (dùng cảnh dự phòng).
      .filter((p) => p !== '/' && !p.startsWith('/dev'))
  );
}

describe('SCREENS', () => {
  it('mọi page.tsx đều có cảnh nền riêng', () => {
    const paths = samplePaths();
    expect(paths.length).toBeGreaterThan(15);
    const missing = paths.filter((p) => sceneKeyForPath(p) === null);
    expect(missing).toEqual([]);
  });

  it('không hai đường dẫn mẫu nào rơi vào cùng một cảnh', () => {
    const keys = samplePaths().map(sceneKeyForPath);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('khoá không trùng nhau', () => {
    const keys = SCREENS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('khớp đúng màn cho đường dẫn động và dấu / cuối', () => {
    expect(sceneKeyForPath('/courses/new')).toBe('course-new');
    expect(sceneKeyForPath('/courses/abc')).toBe('course');
    expect(sceneKeyForPath('/courses/abc/lessons/def/')).toBe('lesson');
    expect(sceneKeyForPath('/courses/abc/lessons/def/practice')).toBe('practice');
    expect(sceneKeyForPath('/dev/ui')).toBeNull();
  });
});

describe('sceneFor', () => {
  const scenes = SCREENS.map((s) => sceneFor(sceneIndex(s.key)));

  it('các cảnh đã đăng ký khác nhau rõ rệt (khoảng cách tham số tối thiểu)', () => {
    // Ngưỡng 0.45 trên vector ~11 chiều chuẩn hoá: thấp hơn nữa thì hai cảnh bắt đầu "na ná" khi
    // nhìn cạnh nhau ở /dev/ui. Đo thực tế (2026-10-13): min ≈ 0.65, trung vị ≈ 1.7.
    let min = Infinity;
    let pair = '';
    scenes.forEach((a, i) =>
      scenes.slice(i + 1).forEach((b, j) => {
        const sa = sceneSignature(a);
        const sb = sceneSignature(b);
        const d = Math.hypot(...sa.map((x, k) => x - sb[k]!));
        if (d < min) {
          min = d;
          pair = `${SCREENS[i]!.key} ~ ${SCREENS[i + 1 + j]!.key}`;
        }
      }),
    );
    expect(min, pair).toBeGreaterThan(0.45);
  });

  it('tất định: cùng chỉ số ra cùng cảnh (SSR = hydrate)', () => {
    expect(sceneFor(7)).toEqual(sceneFor(7));
  });

  it('dải lớn không leo lên vùng chữ tiêu đề (trên 25% khung) và mảng coban nằm sát mép dưới', () => {
    for (const s of scenes) {
      const ys = crestPoints(s.main).map(([, y]) => y);
      expect(Math.min(...ys)).toBeGreaterThan(250);
      expect(s.mass.cy - s.mass.ry).toBeGreaterThan(830);
    }
  });

  it('đường dẫn chưa đăng ký không mượn chỉ số của màn thật', () => {
    expect(fallbackIndex('/dev/ui')).toBeGreaterThanOrEqual(SCREENS.length);
  });
});
