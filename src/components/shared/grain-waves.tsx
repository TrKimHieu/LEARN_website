'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/cn';
import {
  type Scene,
  type SceneKey,
  crestPath,
  fallbackIndex,
  ribbonPath,
  sceneFor,
  sceneIndex,
  sceneKeyForPath,
} from './wave-scenes';

/**
 * Sóng gradient lam có hạt nhiễu — ADR 018 (bổ sung 2026-10-13: hạt chủ đạo, vệt sáng, parallax,
 * mỗi màn một cảnh). Re-export qua `decor.tsx`; xem docblock của `GrainWaves` bên dưới. Hình dạng
 * sóng sinh ở `wave-scenes.ts`; file này chỉ biến cảnh thành ảnh và đặt ảnh lên trang.
 */

/** Đóng gói một chuỗi SVG thành giá trị `background-image`. */
const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/**
 * Ô hạt nhiễu 160×160, `stitchTiles` để lát liền không lộ đường nối.
 *
 * `fractalNoise` cho giá trị dồn quanh xám 50% và alpha lổn nhổn, nên phủ `overlay` gần như không
 * thấy ở tông sáng. `feComponentTransfer` kéo giãn tương phản (slope 1.8 quanh 0.5) và ép alpha = 1:
 * hạt rõ hơn mà không phải tăng opacity — tăng opacity thì cả mảng trắng ngả xám.
 */
const GRAIN_TILE = svgUrl(
  '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">' +
    '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/>' +
    '<feComponentTransfer>' +
    '<feFuncR type="linear" slope="1.8" intercept="-0.4"/>' +
    '<feFuncG type="linear" slope="1.8" intercept="-0.4"/>' +
    '<feFuncB type="linear" slope="1.8" intercept="-0.4"/>' +
    '<feFuncA type="linear" slope="0" intercept="1"/>' +
    '</feComponentTransfer></filter>' +
    '<rect width="100%" height="100%" filter="url(#n)"/></svg>',
);

/**
 * Màu sóng theo tông. `w1…w4` và `app` **đồng bộ tay với `--wave-1…4` và `--app` trong
 * `packages/config/tailwind/theme.css`**: sóng là ảnh, mà ảnh `data:` không đọc được biến CSS.
 * `sheen` (vệt sáng dọc đỉnh sóng) và `shade` (nếp tối ngay dưới đỉnh) chỉ sống trong ảnh, không
 * phải token: ở tông tối vệt sáng là lam nhạt (trắng thì thành vạch phấn trên navy), nếp là navy sâu.
 * Vệt sáng tông tối cố ý dịu (`#93a8ee`, quầng 0.25): vệt sáng chạy SAU chữ sáng là trường hợp thật
 * (nhãn hero màn quên mật khẩu) — bản `#b4c4ff` + quầng 0.45 kéo tương phản chữ `fg` còn 3.6:1.
 * Ở tông sáng vệt trắng sau chữ navy chỉ làm tương phản tốt hơn, nên giữ nguyên.
 */
const WAVE_PALETTE = {
  light: {
    w1: '#dfe7fb',
    w2: '#b3c5f2',
    w3: '#7f9be6',
    w4: '#4569d8',
    app: '#f6f8fd',
    sheen: '#ffffff',
    sheenGlow: 0.45,
    shade: '#2f4fc0',
  },
  dark: {
    w1: '#10184a',
    w2: '#1c2c78',
    w3: '#2a44a8',
    w4: '#3a5fd0',
    app: '#080c24',
    sheen: '#93a8ee',
    sheenGlow: 0.25,
    shade: '#060a20',
  },
} as const;
type Palette = (typeof WAVE_PALETTE)[keyof typeof WAVE_PALETTE];

/**
 * - `hero`: màn đứng một mình (đăng nhập/đăng ký/quên mật khẩu/404/lỗi) — cảnh đầy đủ, parallax.
 * - `app`: nền cố định sau mọi màn trong app — cùng cảnh, nhưng che cột nội dung (xem `appMask`).
 */
type Variant = 'hero' | 'app';

/** Lật ngang quanh tâm khung 1600 — áp lên mọi hình của cảnh (vệt sáng cũng lật theo). */
const flip = (s: Scene, inner: string) =>
  s.mirror ? `<g transform="matrix(-1 0 0 1 1600 0)">${inner}</g>` : inner;

/**
 * Mỗi lớp sóng vẽ hình HAI lần: quầng mờ nhạt (opacity 0.35) ở dưới, bản "dissolve" ở trên — mép
 * sóng vỡ thành hạt, hạt là chất liệu chính, blur chỉ còn là lớp đệm (yêu cầu chủ sản phẩm
 * 2026-10-13: "chủ đạo là hiệu ứng hạt"). Hạt nướng sẵn trong ảnh nên vẫn giải mã một lần, trôi và
 * parallax không vẽ lại.
 */
function waveImage(defs: string, shapes: string, spread: number) {
  // Lọc "dissolve" — mép sóng vỡ thành hạt thay vì mờ mịn:
  //   b  = hình đã blur (`spread`): alpha giảm dần ra mép.
  //   na = nhiễu fractal kéo giãn (×2.5 quanh 0.5) đặt vào kênh alpha.
  //   d  = b.alpha − nhiễu + 0.5 → ngưỡng mềm (slope 5, chỉ mở khi b.alpha vượt nhiễu ≥ 0.08) thì
  //        thành hạt đặc. Gần thân sóng hạt dày, ra xa thưa dần — mật độ hạt thay cho độ mờ.
  //        Phải chừa 0.08: nhiễu kéo giãn bị kẹp về 0 ở nhiều điểm, nếu ngưỡng mở ngay từ 0 thì
  //        vùng b.alpha ≈ 0 (màu chưa nhân alpha = đen) mọc chấm đen nửa trong suốt.
  //   c  = màu của b với alpha ép = 1 (`feColorMatrix` làm việc trên màu chưa nhân alpha) → hạt mang
  //        đủ màu, không nhạt dần như blur.
  // `sRGB` để nhiễu và màu không bị đổi qua linearRGB (mặc định) — hạt ở đó lệch sáng.
  const dissolve =
    `<filter id="d" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">` +
    `<feGaussianBlur in="SourceGraphic" stdDeviation="${spread}" result="b"/>` +
    '<feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="7" result="n"/>' +
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 2.5 0 0 0 -0.75" result="na"/>' +
    '<feComposite in="b" in2="na" operator="arithmetic" k1="0" k2="1" k3="-1" k4="0.5" result="d"/>' +
    '<feComponentTransfer in="d" result="m"><feFuncA type="linear" slope="5" intercept="-2.9"/></feComponentTransfer>' +
    '<feColorMatrix in="b" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1" result="c"/>' +
    '<feComposite in="c" in2="m" operator="in"/></filter>';
  return svgUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">' +
      `<defs>${defs}${dissolve}` +
      // Quầng mờ nhạt bên dưới: vùng hạt thưa không đứng trên nền trắng trơn.
      `<filter id="h" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${Math.round(spread * 1.4)}"/></filter>` +
      '</defs>' +
      `<g filter="url(#h)" opacity="0.35">${shapes}</g>` +
      `<g filter="url(#d)">${shapes}</g></svg>`,
  );
}

/** Lớp A (xa) — dải periwinkle nhạt trên cùng, dải lam thứ hai chéo lên, vệt coban ở góc trên. */
function layerA(c: Palette, s: Scene) {
  const shapes = flip(
    s,
    `<path d="${crestPath(s.top)} L1700 -300 L-100 -300 Z" fill="${c.w1}"/>` +
      `<path d="${crestPath(s.second)} L1700 -400 L-100 -400 Z" fill="${c.w2}" opacity="0.6"/>` +
      `<ellipse cx="${s.cap.cx}" cy="${s.cap.cy}" rx="${s.cap.rx}" ry="${s.cap.ry}" fill="${c.w3}" opacity="0.9"/>`,
  );
  return waveImage('', shapes, 40);
}

/**
 * Lớp B (giữa) — dải lớn, nếp tối ngay dưới đỉnh của nó, dải trắng cắt chéo, mảng coban đậm sát mép
 * dưới. Nếp tối là một nét dày dời xuống 34px theo đúng đỉnh: dải đọc như tấm lụa gập chứ không như
 * một mảng màu phẳng.
 */
function layerB(c: Palette, s: Scene) {
  const main = crestPath(s.main);
  const defs =
    '<linearGradient id="m" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${c.w2}"/><stop offset="0.55" stop-color="${c.w3}"/><stop offset="1" stop-color="${c.w4}"/>` +
    '</linearGradient>';
  const shapes = flip(
    s,
    `<path d="${main} L1700 1100 L-100 1100 Z" fill="url(#m)"/>` +
      `<path d="${main}" transform="translate(0 34)" fill="none" stroke="${c.shade}" stroke-width="46" opacity="0.22"/>` +
      `<path d="${ribbonPath(s.ribbon, s.ribbonThickness)}" fill="${c.app}" opacity="0.8"/>` +
      `<ellipse cx="${s.mass.cx}" cy="${s.mass.cy}" rx="${s.mass.rx}" ry="${s.mass.ry}" fill="${c.w4}" opacity="0.85"/>`,
  );
  return waveImage(defs, shapes, 40);
}

/**
 * Lớp C (gần) — vệt sáng mảnh chạy dọc đỉnh sóng, mờ dần ở hai đầu. Mỗi vệt hai nét: lõi 2.5px
 * blur nhẹ + quầng 16px blur rộng. Vệt sáng vẽ lại đúng đỉnh của cảnh nên luôn nằm trên mép dải.
 */
function layerC(c: Palette, s: Scene) {
  const fade = (id: string, peak: number, at: number) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="${c.sheen}" stop-opacity="0"/>` +
    `<stop offset="${at}" stop-color="${c.sheen}" stop-opacity="${peak}"/>` +
    `<stop offset="1" stop-color="${c.sheen}" stop-opacity="0"/></linearGradient>`;
  const streak = (d: string, id: string) =>
    `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="16" filter="url(#wide)" opacity="${c.sheenGlow}"/>` +
    `<path d="${d}" fill="none" stroke="url(#${id})" stroke-width="2.5" filter="url(#core)"/>`;
  const defs =
    fade('s1', 0.9, 0.42) +
    fade('s2', 0.75, 0.42) +
    fade('s3', 0.6, 0.35) +
    '<filter id="core" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="1.2"/></filter>' +
    '<filter id="wide" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="9"/></filter>';
  const shapes = flip(
    s,
    streak(crestPath(s.second), 's1') +
      streak(crestPath(s.main), 's2') +
      streak(crestPath(s.ribbon), 's3'),
  );
  return svgUrl(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">' +
      `<defs>${defs}</defs>${shapes}</svg>`,
  );
}

type Pair = { light: string; dark: string };
type SceneImages = { a: Pair; b: Pair; c: Pair };

/**
 * Ảnh của một cảnh, tính một lần rồi giữ lại — chuyển qua lại giữa các màn không dựng lại chuỗi.
 * Hero và app dùng chung ảnh; khác nhau chỉ ở CSS (mặt nạ, parallax).
 */
const imageCache = new Map<number, SceneImages>();
function imagesFor(index: number): SceneImages {
  const hit = imageCache.get(index);
  if (hit) return hit;
  const s = sceneFor(index);
  const pair = (make: (c: Palette, s: Scene) => string): Pair => ({
    light: make(WAVE_PALETTE.light, s),
    dark: make(WAVE_PALETTE.dark, s),
  });
  const built = { a: pair(layerA), b: pair(layerB), c: pair(layerC) };
  imageCache.set(index, built);
  return built;
}

/**
 * Một lớp sóng: hai ảnh (sáng/tối), CSS chọn ảnh theo `data-theme` — không cần JS, không nháy.
 *
 * Hai khung lồng nhau vì hai `transform` khác nguồn: khung ngoài nhận parallax (`.wave-parallax`,
 * độ sâu `--depth` px), khung trong chạy keyframe trôi. Chung một phần tử thì keyframe ghi đè.
 */
function WaveLayer({ images, depth, drift }: { images: Pair; depth: number; drift?: string }) {
  const img = 'absolute inset-0 bg-cover bg-center bg-no-repeat';
  return (
    <div
      className="wave-parallax absolute -inset-[6%]"
      style={{ '--depth': depth } as React.CSSProperties}
    >
      <div className={cn('absolute inset-0 will-change-transform', drift)}>
        <div className={cn(img, 'dark:hidden')} style={{ backgroundImage: images.light }} />
        <div className={cn(img, 'hidden dark:block')} style={{ backgroundImage: images.dark }} />
      </div>
    </div>
  );
}

/** Ba lớp sóng của một cảnh, xa → gần. `still`: không trôi (biến thể `app`). */
function SceneLayers({
  index,
  still,
  className,
}: {
  index: number;
  still: boolean;
  className?: string;
}) {
  const images = imagesFor(index);
  return (
    <div className={cn('absolute inset-0', className)}>
      <WaveLayer images={images.a} depth={6} drift={still ? undefined : 'animate-wave-drift-a'} />
      <WaveLayer images={images.b} depth={12} drift={still ? undefined : 'animate-wave-drift-b'} />
      {/* Âm = cùng chiều chuột: con trỏ là nguồn sáng, vệt sáng trượt về phía nó. */}
      <WaveLayer images={images.c} depth={-14} />
    </div>
  );
}

/** Thời gian hoà cảnh khi đổi màn — khớp `--animate-scene-in/out` trong `globals.css`. */
const SCENE_FADE_MS = 650;

/**
 * Đổi màn trong cùng một layout (AppShell, khung đăng nhập) thì cảnh cũ mờ dần trong khi cảnh mới
 * hiện lên, rồi cảnh cũ bị gỡ. Chỉ hai cảnh cùng lúc: bấm nhanh qua nhiều màn thì cảnh giữa bị bỏ.
 * Giảm chuyển động: đổi thẳng, không giữ cảnh cũ (không có animation để chờ).
 */
function useSceneStack(index: number) {
  const [stack, setStack] = useState<number[]>([index]);

  useEffect(() => {
    setStack((s) => {
      if (s[s.length - 1] === index) return s;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      return reduce ? [index] : [s[s.length - 1]!, index];
    });
  }, [index]);

  useEffect(() => {
    if (stack.length < 2) return;
    const t = window.setTimeout(() => setStack((s) => s.slice(-1)), SCENE_FADE_MS);
    return () => window.clearTimeout(t);
  }, [stack]);

  return stack;
}

/**
 * Parallax theo con trỏ: ghi vị trí chuột (−1…1) vào `--px` / `--py` trên khung gốc; CSS
 * (`.wave-parallax` trong `globals.css`) dời mỗi lớp `--depth` px theo đó (dương = ngược chuột, âm =
 * cùng chiều), `transition` 1.4s làm mượt. Chỉ bật khi có chuột thật (`hover: hover` +
 * `pointer: fine`) và không giảm chuyển động. Gom về một lần ghi mỗi khung hình (rAF); không có
 * vòng lặp rAF chạy liên tục.
 */
function usePointerParallax(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    const write = () => {
      frame = 0;
      root.style.setProperty('--px', x.toFixed(3));
      root.style.setProperty('--py', y.toFixed(3));
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };
    const onMove = (e: PointerEvent) => {
      x = (e.clientX / window.innerWidth) * 2 - 1;
      y = (e.clientY / window.innerHeight) * 2 - 1;
      queue();
    };
    // Chuột rời cửa sổ: các lớp trôi về giữa thay vì đứng lệch.
    const onLeave = () => {
      x = 0;
      y = 0;
      queue();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled]);

  return ref;
}

/**
 * Mặt nạ của biến thể `app`: sóng hiện đủ ở **hai lề** và **dải trên cùng**, cột nội dung ở giữa
 * sạch. Lý do đo được: chữ phụ (`fg-subtle`) và liên kết (`accent`) đặt thẳng trên mảng coban không
 * đạt 4.5:1 ở bất kỳ cường độ nào ≥ 50%, mà nền app là `fixed` nên chữ cuộn qua mọi vùng của cảnh.
 * Hai lớp mặt nạ cộng nhau (mặc định `add`): dọc giữ 0–40px rồi tan hết ở 140px — tức chỉ sau header
 * 56px (header có nền `app/70` riêng). Bản đầu giữ tới 300px: đo điểm ảnh thật thì tab con admin và
 * breadcrumb (`fg-subtle`, y ≈ 115–140px) chỉ đạt 3.3–3.9:1 trên hạt sóng. Ngang trong suốt
 * trong `clear` px quanh tâm, tan dần 160px ra lề (100px thì mép mặt nạ lộ thành một đường thẳng
 * đứng giữa vùng hạt). Màn hẹp (điện thoại) lề gần như bằng 0 — chỉ
 * còn dải trên, đúng ý: đọc trên điện thoại cần nền yên.
 */
function appMask(clear: number) {
  const fadeIn = clear - 50;
  const solid = clear + 110;
  const m =
    'linear-gradient(to bottom, #000 0, #000 40px, transparent 140px), ' +
    'linear-gradient(to right, ' +
    `#000 calc(50% - ${solid}px), transparent calc(50% - ${fadeIn}px), ` +
    `transparent calc(50% + ${fadeIn}px), #000 calc(50% + ${solid}px))`;
  return { maskImage: m, WebkitMaskImage: m };
}

/**
 * Sóng gradient lam có hạt nhiễu — nền của mọi màn.
 *
 * **Mỗi màn một cảnh** (`wave-scenes.ts`): cảnh chọn theo `scene` nếu truyền (404, lỗi, bảng mẫu),
 * không thì theo đường dẫn hiện tại. Đường dẫn chưa đăng ký dùng cảnh dự phòng băm từ URL, không
 * bao giờ mượn cảnh của màn thật.
 *
 * Bốn lớp chồng nhau, xa → gần: (A) dải trên, (B) dải lớn + dải trắng + mảng coban, (C) vệt sáng dọc
 * đỉnh sóng, (D) hạt nhiễu. A và B trôi lệch nhịp (`animate-wave-drift-a/b`, 28s / 36s) nên các dải
 * như đang "thở"; C đứng yên nên vệt sáng trượt tương đối trên mép dải. Mỗi lớp tràn 6% ra ngoài
 * khung để lúc trôi không lộ mép. Hạt nhiễu đứng yên ở trên cùng, nên kết cấu không "bơi" theo sóng.
 *
 * **Trong app nền đứng yên** — không trôi, không parallax. Đo trên CPU (`/settings`, cuộn liên tục):
 * sóng trôi trên lớp `fixed` phủ cả khung nhìn có mặt nạ → 13 fps; đứng yên → 58 fps. Bản `ambient`
 * cũ chỉ cao 520px nên chưa lộ. Hơn nữa người dùng đang học/làm bài: nền yên là đúng chỗ.
 *
 * **Parallax chỉ ở `hero`** (đăng nhập/đăng ký/404/lỗi). Trong app người dùng rê chuột liên tục để
 * làm bài; nền dịch theo tay ở đó là gây xao nhãng, không phải trang trí. Hai chiều có chủ đích:
 * - Dải sóng A/B dời **ngược** chuột (6 / 12px): như nghiêng đầu nhìn vật ở xa — đọc thành chiều sâu,
 *   và nền không trôi về phía ô form người dùng đang bấm.
 * - Vệt sáng C dời **cùng** chuột (14px): con trỏ là nguồn sáng, ánh phản chiếu trượt về phía nó.
 *   Sóng lùi, ánh sáng theo tay — lệch nhau tới ~26px nên vệt sáng lướt trên mặt dải như đèn trên lụa.
 *
 * **Vì sao sóng là ẢNH (`background-image` data URI), không phải `<svg>` nội tuyến:** đã đo trên
 * Chromium vẽ bằng CPU (máy không có/không bật tăng tốc GPU) — `<svg>` nội tuyến có blur bị vẽ lại
 * mỗi khung hình hễ trên trang còn một animation nào chạy (kể cả một ngôi sao nhỏ), trang tụt từ 61
 * xuống ~10 fps. Ảnh thì được giải mã một lần thành bitmap rồi chỉ dời đi. Có GPU thì hai cách như
 * nhau (61 fps). Đổi lại: ảnh không đọc được biến CSS, nên màu nằm ở `WAVE_PALETTE` (sync tay) và
 * mỗi tông một ảnh. Cùng lý do, không dùng shader WebGL: không có GPU thì shader cũng vẽ bằng CPU.
 *
 * Hạt nhiễu: ô `feTurbulence` xám lát gạch, phủ `mix-blend-mode: overlay` — giữ nguyên vùng trắng,
 * chỉ làm sần vùng lam như ảnh gốc. Khung có nền `bg-app` riêng vì overlay trong một nhóm cô lập mà
 * không có nền sẽ hiện thẳng lớp xám.
 */
export function GrainWaves({
  variant = 'hero',
  scene,
  clear = 512,
  parallax,
  className,
}: {
  variant?: Variant;
  /** Ép một cảnh cụ thể — cho màn không có URL riêng (404, lỗi) và bảng mẫu `/dev/ui`. */
  scene?: SceneKey;
  /** `app`: nửa bề rộng cột nội dung cần để sạch (px). `max-w-5xl` = 512, `max-w-6xl` = 576. */
  clear?: number;
  /** Mặc định bật ở `hero`, luôn tắt ở `app`. Tắt ở bảng mẫu (nhiều cảnh cùng trang). */
  parallax?: boolean;
  className?: string;
}) {
  const hero = variant === 'hero';
  const pathname = usePathname() ?? '/';
  const pathKey = sceneKeyForPath(pathname);
  const index = scene ? sceneIndex(scene) : pathKey ? sceneIndex(pathKey) : fallbackIndex(pathname);
  const stack = useSceneStack(index);
  const ref = usePointerParallax(hero && (parallax ?? true));

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 isolate overflow-hidden bg-app',
        className,
      )}
      style={hero ? undefined : appMask(clear)}
    >
      {stack.map((i, n) => (
        <SceneLayers
          key={i}
          index={i}
          still={!hero}
          className={
            stack.length > 1 ? (n === 0 ? 'animate-scene-out' : 'animate-scene-in') : undefined
          }
        />
      ))}
      <div
        className="absolute inset-0 mix-blend-overlay"
        // `--grain`: 1 ở tông sáng, thấp hơn ở tông tối — hạt xám phủ overlay trên nền navy đậm
        // thành một lớp sương xám, không còn là kết cấu.
        style={{
          backgroundImage: GRAIN_TILE,
          backgroundSize: '160px 160px',
          opacity: `calc(var(--grain, 1) * ${hero ? 0.26 : 0.22})`,
        }}
      />
    </div>
  );
}
