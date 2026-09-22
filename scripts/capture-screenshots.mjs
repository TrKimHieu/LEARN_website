/**
 * Chụp ảnh UI thật cho portfolio (HANDBOOK §14.1 mục 6 — "ảnh UI thật, không dùng ảnh giả").
 *
 * Yêu cầu trước khi chạy:
 *   docker compose -f infra/docker-compose.yml up -d
 *   npm run db:migrate && npm run db:seed
 *   npm run dev   (api :4000, web :3000, worker)
 *
 * Chạy: node scripts/capture-screenshots.mjs
 * Ghi ra: docs/screenshots/*.png (sao chép sang apps/web/public/screenshots/ để web app serve).
 */
import { chromium } from 'playwright';
import { mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'docs', 'screenshots');
const PUBLIC_DIR = path.join(ROOT, 'apps', 'web', 'public', 'screenshots');
const BASE_URL = 'http://localhost:3000';

mkdirSync(DOCS_DIR, { recursive: true });
mkdirSync(PUBLIC_DIR, { recursive: true });

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.getByLabel('Email').fill(email);
  // `exact: true` là bắt buộc kể từ khi ô mật khẩu có nút hiện/ẩn: nhãn của nút
  // ("Hiện mật khẩu") chứa chuỗi "Mật khẩu", nên khớp lỏng sẽ trúng cả hai.
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
}

async function shoot(page, name) {
  // Chờ khung xương loading (animate-pulse) biến mất — networkidle không đủ vì fetch qua
  // TanStack Query chạy sau khi hydrate, có thể vẫn đang chạy lúc networkidle bắn ra.
  await page
    .locator('.animate-pulse')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(300);
  const file = path.join(DOCS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  ✓ ${name}.png`);
}

async function main() {
  const browser = await chromium.launch();

  // ---- Learner (demo@learn.ai) ----
  const learner = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const lp = await learner.newPage();
  await login(lp, 'demo@learn.ai', 'Demo@12345');
  await shoot(lp, 'dashboard');

  await lp.getByRole('link', { name: 'Khóa học' }).click();
  await lp.waitForLoadState('networkidle');
  // Loại "/courses/new" (nút Tạo khóa học) khỏi selector — chỉ khớp link tới course thật (có UUID).
  const firstCourse = lp.locator('a[href^="/courses/"]:not([href="/courses/new"])').first();
  await firstCourse.click();
  await lp.waitForURL(/\/courses\/[0-9a-f-]{20,}/, { timeout: 10000 });
  await lp.waitForLoadState('networkidle');
  await shoot(lp, 'course-detail');

  const firstLessonLink = lp.locator('a[href*="/lessons/"]').first();
  if (await firstLessonLink.count()) {
    await firstLessonLink.click();
    await lp.waitForURL(/\/lessons\/[0-9a-f-]{20,}$/, { timeout: 10000 });
    await lp.waitForLoadState('networkidle');
    await shoot(lp, 'lesson');

    const practiceLink = lp.getByRole('link', { name: /luyện tập|làm bài/i });
    if (await practiceLink.count()) {
      await practiceLink.first().click();
      await lp.waitForURL(/\/practice$/, { timeout: 10000 });
      await lp.waitForLoadState('networkidle');
      await shoot(lp, 'practice');
    }
  }

  await lp.goto(`${BASE_URL}/settings`);
  await lp.waitForLoadState('networkidle');
  await shoot(lp, 'settings');
  await learner.close();

  // ---- Admin ----
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const ap = await adminCtx.newPage();
  await login(ap, 'admin@learn.ai', 'Admin@12345');
  // `/admin` tự nó không có nội dung — chỉ redirect phía client sang `/admin/metrics`
  // (`useEffect` + `router.replace`). Vào thẳng `/admin` rồi chụp từng làm ảnh trắng
  // trơn: lúc `shoot()` kiểm tra `.animate-pulse`, trang `/admin` chưa kịp redirect
  // nên chưa có khung xương nào để đợi detach — `waitFor({state:'detached'})` coi một
  // phần tử KHÔNG TỒN TẠI là "đã detach" nên trả về ngay, rồi chỉ còn 300ms cố định,
  // không đủ cho redirect + biên dịch route lần đầu (dev mode) + gọi API metrics.
  // Vào thẳng đích cuối để bỏ hẳn khoảng trắng đó.
  await ap.goto(`${BASE_URL}/admin/metrics`);
  await ap.waitForLoadState('networkidle');
  await shoot(ap, 'admin');
  await adminCtx.close();

  await browser.close();

  for (const file of readdirSync(DOCS_DIR)) {
    if (file.endsWith('.png')) copyFileSync(path.join(DOCS_DIR, file), path.join(PUBLIC_DIR, file));
  }
  console.log(`\nĐã chụp xong — xem docs/screenshots/ và apps/web/public/screenshots/.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
