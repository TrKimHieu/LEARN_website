/**
 * Cảnh nền sóng — mỗi màn hình một hình dạng riêng (ADR 018, bổ sung 2026-10-13).
 *
 * Chủ sản phẩm yêu cầu "không được trùng hình dạng nền giữa các màn hình". Thay vì vẽ tay 21 cảnh,
 * hình sóng được SINH từ một bộ tham số (độ cao, độ nghiêng, biên độ, tần số, pha của từng dải; vị trí
 * mảng coban; lật gương), và mỗi màn có một chỉ số cố định trong `SCREENS`. Tham số lấy từ dãy
 * Weyl (cộng dồn một số vô tỉ rồi lấy phần lẻ) — dãy này rải đều trên [0, 1) và không lặp, nên hai
 * chỉ số khác nhau luôn ra hai hình khác nhau, kể cả hai màn đứng cạnh nhau trong thanh điều hướng.
 * `wave-scenes.test.ts` khoá điều đó: mọi `page.tsx` phải có cảnh, và các cảnh phải đủ xa nhau.
 *
 * Module thuần (không React, không DOM) để test được và dùng chung server/client: cùng đường dẫn ra
 * cùng cảnh ở cả SSR lẫn hydrate.
 *
 * Khung toạ độ 1600×1000, trùng `viewBox` của ảnh sóng trong `grain-waves.tsx`.
 */

/** Một màn hình có cảnh riêng. `match` null: màn không có URL riêng (404, lỗi) — truyền `scene`. */
type ScreenDef = { key: string; match: RegExp | null };

/**
 * Thứ tự = chỉ số cảnh. **Chỉ thêm vào cuối** — chèn giữa sẽ đổi hình nền của mọi màn phía sau.
 * Đường dẫn động (`[courseId]`…) khớp bằng `[^/]+`, nên mọi khóa học dùng chung cảnh của màn chi
 * tiết khóa học: "màn hình" là loại màn, không phải từng bản ghi.
 */
export const SCREENS = [
  { key: 'login', match: /^\/login$/ },
  { key: 'register', match: /^\/register$/ },
  { key: 'forgot-password', match: /^\/forgot-password$/ },
  { key: 'reset-password', match: /^\/reset-password$/ },
  { key: 'dashboard', match: /^\/dashboard$/ },
  { key: 'courses', match: /^\/courses$/ },
  { key: 'course-new', match: /^\/courses\/new$/ },
  { key: 'course', match: /^\/courses\/[^/]+$/ },
  { key: 'lesson', match: /^\/courses\/[^/]+\/lessons\/[^/]+$/ },
  { key: 'practice', match: /^\/courses\/[^/]+\/lessons\/[^/]+\/practice$/ },
  { key: 'progress', match: /^\/progress$/ },
  { key: 'settings', match: /^\/settings$/ },
  { key: 'admin', match: /^\/admin$/ },
  { key: 'admin-users', match: /^\/admin\/users$/ },
  { key: 'admin-courses', match: /^\/admin\/courses$/ },
  { key: 'admin-ai-jobs', match: /^\/admin\/ai-jobs$/ },
  { key: 'admin-ai-job', match: /^\/admin\/ai-jobs\/[^/]+$/ },
  { key: 'admin-subscriptions', match: /^\/admin\/subscriptions$/ },
  { key: 'admin-metrics', match: /^\/admin\/metrics$/ },
  { key: 'not-found', match: null },
  { key: 'error', match: null },
] as const satisfies readonly ScreenDef[];

export type SceneKey = (typeof SCREENS)[number]['key'];

/** Đường cong một đỉnh sóng: y nội suy y0 → y1 theo chiều ngang, cộng một sóng sin. */
export type Crest = { y0: number; y1: number; amp: number; freq: number; phase: number };

export type Scene = {
  index: number;
  /** Lật ngang cả cảnh — mảng coban đổi góc, dải chéo đổi chiều. */
  mirror: boolean;
  /** Dải periwinkle nhạt trên cùng (tô phía trên đỉnh). */
  top: Crest;
  /** Dải lam thứ hai, chéo lên và thoát ra mép trên (tô phía trên đỉnh). */
  second: Crest;
  /** Dải lớn (tô phía dưới đỉnh). */
  main: Crest;
  /** Dải trắng cắt chéo: mép trên + bề dày. */
  ribbon: Crest;
  ribbonThickness: number;
  /** Mảng coban đậm sát mép dưới, và vệt coban nhỏ ở góc trên đối diện. */
  mass: { cx: number; cy: number; rx: number; ry: number };
  cap: { cx: number; cy: number; rx: number; ry: number };
};

const frac = (x: number) => x - Math.floor(x);

/**
 * Các bước Weyl — mỗi tham số một số vô tỉ riêng để các chiều không đi cùng nhịp (tỉ lệ vàng,
 * √2 − 1, nghịch đảo số nhựa…).
 */
const STEPS = [
  0.6180339887, 0.4142135624, 0.7548776662, 0.569840291, 0.3247179572, 0.8908987181, 0.2360679775,
  0.7320508076, 0.1622776602, 0.6457513111, 0.4494897428, 0.3166247904,
] as const;

/** Giá trị thứ `k` (0…1) của cảnh `i`. Lệch 0.5 để cảnh 0 không rơi vào toàn cực tiểu. */
const u = (i: number, k: number) => frac(0.5 + (i + 1) * STEPS[k % STEPS.length]!);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Sinh cảnh từ chỉ số. Mọi khoảng giá trị đã soát bằng mắt ở mục "Lớp nền" của `/dev/ui`:
 * - dải lớn nằm ở 42–66% chiều cao (± biên độ, đỉnh không cao hơn 25%) — dưới thẻ form, không leo lên chữ tiêu đề;
 * - mảng coban tâm ở 1070–1110 (ngoài khung) nên chỉ lộ một vành ở mép dưới — chữ bước 01/02/03 của
 *   màn đăng nhập không bao giờ nằm trên coban đặc.
 */
export function sceneFor(index: number): Scene {
  const v = (k: number) => u(index, k);
  const mainY0 = lerp(420, 650, v(0));
  const main: Crest = {
    y0: mainY0,
    y1: lerp(390, 660, v(1)),
    amp: lerp(40, 130, v(2)),
    freq: lerp(0.45, 1.2, v(3)),
    phase: v(4),
  };
  return {
    index,
    // Dãy Weyl riêng (1/√2) — lật khoảng một nửa số cảnh, không theo nhịp đều trái-phải-trái.
    mirror: frac(0.5 + (index + 1) * 0.7071067812) >= 0.5,
    top: {
      y0: lerp(20, 130, v(5)),
      y1: lerp(50, 190, v(6)),
      amp: lerp(30, 75, v(7)),
      freq: lerp(0.5, 0.95, v(8)),
      phase: v(9),
    },
    second: {
      y0: lerp(240, 380, v(10)),
      y1: lerp(-260, -110, v(11)),
      amp: lerp(25, 60, v(3)),
      freq: lerp(0.45, 0.8, v(7)),
      phase: frac(v(2) + 0.35),
    },
    main,
    ribbon: {
      ...main,
      y0: main.y0 + lerp(140, 200, v(8)),
      y1: main.y1 + lerp(150, 230, v(5)),
      phase: frac(main.phase + lerp(0.04, 0.1, v(9))),
    },
    ribbonThickness: lerp(60, 120, v(11)),
    mass: {
      cx: lerp(1200, 1600, v(6)),
      cy: lerp(1070, 1110, v(1)),
      rx: lerp(420, 600, v(10)),
      ry: lerp(190, 230, v(4)),
    },
    cap: {
      cx: lerp(1450, 1700, v(0)),
      cy: lerp(-40, 10, v(3)),
      rx: lerp(170, 260, v(9)),
      ry: lerp(70, 110, v(11)),
    },
  };
}

/** Chỉ số cảnh của một khoá. */
export function sceneIndex(key: SceneKey): number {
  return SCREENS.findIndex((s) => s.key === key);
}

/** Đường dẫn → khoá cảnh; `null` nếu chưa đăng ký (ví dụ `/dev/ui`). */
export function sceneKeyForPath(pathname: string): SceneKey | null {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return SCREENS.find((s) => s.match?.test(path))?.key ?? null;
}

/**
 * Chỉ số cho một đường dẫn chưa đăng ký: băm ra một chỉ số NGOÀI dải đã đăng ký, để không vô tình
 * mượn hình của một màn thật.
 */
export function fallbackIndex(pathname: string): number {
  let h = 2166136261;
  for (let i = 0; i < pathname.length; i += 1) h = Math.imul(h ^ pathname.charCodeAt(i), 16777619);
  return SCREENS.length + ((h >>> 0) % 997);
}

/** Điểm mẫu của một đỉnh sóng, từ x = −100 tới 1700. */
export function crestPoints(c: Crest, samples = 9): [number, number][] {
  return Array.from({ length: samples }, (_, i) => {
    const t = i / (samples - 1);
    const x = -100 + t * 1800;
    const y = lerp(c.y0, c.y1, t) + c.amp * Math.sin(2 * Math.PI * (c.freq * t + c.phase));
    return [x, y];
  });
}

const r = (n: number) => Math.round(n * 10) / 10;

/**
 * Nối điểm thành đường cong trơn (Catmull–Rom → Bézier bậc ba). `move` false: bắt đầu bằng `L` để
 * nối tiếp một đường đang vẽ (dùng cho mép dưới của dải trắng, đi ngược chiều).
 */
export function smoothPath(points: [number, number][], move = true): string {
  const p = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))]!;
  let d = `${move ? 'M' : 'L'}${r(p(0)[0])} ${r(p(0)[1])}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    d +=
      ` C${r(x1 + (x2 - x0) / 6)} ${r(y1 + (y2 - y0) / 6)},` +
      ` ${r(x2 - (x3 - x1) / 6)} ${r(y2 - (y3 - y1) / 6)},` +
      ` ${r(x2)} ${r(y2)}`;
  }
  return d;
}

/** Đường hở của một đỉnh — dùng cho vệt sáng và nếp tối. */
export const crestPath = (c: Crest) => smoothPath(crestPoints(c));

/** Dải trắng cắt chéo: mép trên đi xuôi, mép dưới (dời xuống `thickness`, pha lệch) đi ngược. */
export function ribbonPath(c: Crest, thickness: number): string {
  const upper = crestPoints(c);
  const lower = crestPoints({ ...c, phase: frac(c.phase + 0.05) })
    .map(([x, y], i, all) => {
      // Bề dày thuôn về hai đầu một chút: dải trông như lụa xoắn, không như một ống đều.
      const t = i / (all.length - 1);
      return [x, y + thickness * (0.75 + 0.5 * Math.sin(Math.PI * t))] as [number, number];
    })
    .reverse();
  return `${smoothPath(upper)} ${smoothPath(lower, false)} Z`;
}

/**
 * Vector tham số chuẩn hoá (0…1) để đo hai cảnh khác nhau bao nhiêu — `wave-scenes.test.ts`.
 * Lật gương tính như một chiều có trọng số lớn: cùng tham số nhưng lật là một hình khác hẳn.
 */
export function sceneSignature(s: Scene): number[] {
  const n = (x: number, a: number, b: number) => (x - a) / (b - a);
  return [
    s.mirror ? 1.5 : 0,
    n(s.main.y0, 420, 650),
    n(s.main.y1, 390, 660),
    n(s.main.amp, 40, 130),
    n(s.main.freq, 0.45, 1.2),
    // Pha là góc: 0.02 và 0.98 gần nhau, nên đo bằng cos/sin chứ không bằng hiệu thẳng.
    0.5 + 0.5 * Math.cos(2 * Math.PI * s.main.phase),
    0.5 + 0.5 * Math.sin(2 * Math.PI * s.main.phase),
    n(s.top.y0, 20, 130),
    n(s.top.y1, 50, 190),
    n(s.second.y0, 240, 380),
    n(s.mass.cx, 1200, 1600),
  ];
}
