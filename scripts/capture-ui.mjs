/**
 * Chụp một route bất kỳ thành ảnh full-page, **không cần Docker/API**.
 *
 * Khác `capture-screenshots.mjs` (chụp ảnh thật cho portfolio, phải đăng nhập và
 * cần Postgres/MinIO/worker chạy sẵn), script này dành cho vòng lặp sửa giao
 * diện: chỉ cần `npm run dev:web` là chụp được, và mặc định nhắm vào bảng mẫu
 * `/dev/ui` — nơi mọi primitive nằm chung một trang.
 *
 * Dùng:
 *   node scripts/capture-ui.mjs                        # /dev/ui, 1440px
 *   node scripts/capture-ui.mjs /login /register       # nhiều route một lượt
 *   node scripts/capture-ui.mjs --width 390 /dev/ui    # kiểm tra bố cục hẹp
 *   node scripts/capture-ui.mjs --dark /dev/ui         # giả lập prefers-color-scheme
 *   node scripts/capture-ui.mjs --reduced-motion /dev/ui
 *
 * Ghi ra: docs/screenshots/ui/<route>.png (thư mục này chỉ để xem, không phải
 * ảnh portfolio nên đừng chép sang apps/web/public/).
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(path.resolve(__dirname, '..'), 'docs', 'screenshots', 'ui');
const BASE_URL = process.env.WEB_URL ?? 'http://localhost:3000';

function parseArgs(argv) {
  const routes = [];
  let width = 1440;
  let colorScheme = 'light';
  let reducedMotion = 'no-preference';

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--width') {
      width = Number(argv[(i += 1)]);
      if (!Number.isFinite(width) || width < 320) {
        throw new Error(`--width không hợp lệ: ${argv[i]}`);
      }
    } else if (arg === '--dark') {
      colorScheme = 'dark';
    } else if (arg === '--reduced-motion') {
      reducedMotion = 'reduce';
    } else if (arg.startsWith('--')) {
      throw new Error(`Tham số lạ: ${arg}`);
    } else {
      routes.push(arg.startsWith('/') ? arg : `/${arg}`);
    }
  }

  return { routes: routes.length > 0 ? routes : ['/dev/ui'], width, colorScheme, reducedMotion };
}

/** `/courses/new` -> `courses-new`, `/` -> `root`. */
function fileNameFor(route) {
  const slug = route.replace(/^\/+|\/+$/g, '').replace(/[^\w-]+/g, '-');
  return slug === '' ? 'root' : slug;
}

async function main() {
  const { routes, width, colorScheme, reducedMotion } = parseArgs(process.argv.slice(2));
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 2,
    colorScheme,
    reducedMotion,
  });
  const page = await context.newPage();

  // Lỗi runtime của trang dễ bị bỏ sót khi chỉ nhìn ảnh — in ra luôn.
  page.on('pageerror', (err) => console.error(`  ! lỗi trang: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error(`  ! console: ${msg.text()}`);
  });

  let failed = 0;
  for (const route of routes) {
    const url = `${BASE_URL}${route}`;
    try {
      const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (res && res.status() >= 400) {
        console.error(`  ✗ ${route} — HTTP ${res.status()}`);
        failed += 1;
        continue;
      }
      // Chờ animation vào chỗ rồi mới chụp. `Reveal` (mount, ~250ms) là phần lớn;
      // `RevealOnScroll`/`StaggerOnScroll` (trang chủ) dùng `whileInView` — nếu quan
      // sát không bao giờ bắn (tab nền, cửa sổ bị che, đúng thứ đang chụp) thì có lưới
      // an toàn tự ép hiện sau 1000ms (`FORCE_SHOW_MS` ở lib/motion.tsx). Chờ 1500ms để
      // luôn qua khỏi mốc đó.
      await page.waitForTimeout(1500);
      // Hậu tố ghi lại điều kiện chụp, nếu không bản --dark và --reduced-motion
      // sẽ ghi đè lên bản thường và không so sánh được với nhau.
      const suffix =
        (colorScheme === 'dark' ? '-dark' : '') + (reducedMotion === 'reduce' ? '-rm' : '');
      const file = path.join(OUT_DIR, `${fileNameFor(route)}-${width}${suffix}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
    } catch (err) {
      console.error(`  ✗ ${route} — ${err.message}`);
      failed += 1;
    }
  }

  await browser.close();
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
