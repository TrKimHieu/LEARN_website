// Kiểm tra giao diện chịu được chữ dài nhất mà API cho phép.
//
// Mở app đang chạy bằng trình duyệt thật, thay mọi `[data-user-text]` bằng chuỗi 200 ký tự, thêm URL
// dài, bảng rộng và khối code vào bài đọc, rồi đo ở ba khổ màn hình. Có phần tử tràn thì thoát mã 1.
//
//   LEARN_TEST_EMAIL=... LEARN_TEST_PASSWORD=... npm run check:long-text
//
// Biến tuỳ chọn: LEARN_APP_URL (mặc định http://127.0.0.1:3100), LEARN_BROWSER_CHANNEL (msedge,
// chrome), LEARN_SHOT_DIR (thư mục lưu ảnh chụp để xem bằng mắt).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { findOverflows, stressPage } from './long-text-stress.mjs';

const base = process.env.LEARN_APP_URL ?? 'http://127.0.0.1:3100';
const email = process.env.LEARN_TEST_EMAIL;
const password = process.env.LEARN_TEST_PASSWORD;
const shots = process.env.LEARN_SHOT_DIR;
const WIDTHS = [375, 768, 1280];

if (!email || !password) {
  console.error('Cần đặt LEARN_TEST_EMAIL và LEARN_TEST_PASSWORD.');
  process.exit(2);
}
if (shots) mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ channel: process.env.LEARN_BROWSER_CHANNEL ?? 'msedge' });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();

await page.goto(`${base}/login`);
await page.fill('#email', email);
await page.fill('#password', password);
await page.click('button[type=submit]');
await page.waitForURL('**/dashboard');

// Lấy một khóa và một bài có thật trong tài khoản để kiểm cả trang chi tiết.
await page.goto(`${base}/courses`);
const courseHref = await page
  .locator('main a[href^="/courses/"]:not([href="/courses/new"])')
  .first()
  .getAttribute('href', { timeout: 10000 });
await page.goto(base + courseHref);
const lessonHref = await page
  .locator(`main a[href^="${courseHref}/lessons/"]`)
  .first()
  .getAttribute('href', { timeout: 10000 })
  .catch(() => null);

const routes = ['/dashboard', '/courses', courseHref, '/progress', '/settings'];
if (lessonHref) routes.push(lessonHref, `${lessonHref}/practice`);

let failed = 0;
for (const width of WIDTHS) {
  await page.setViewportSize({ width, height: 800 });
  for (const route of routes) {
    await page.goto(base + route);
    await page.waitForLoadState('networkidle');
    const stressed = await page.evaluate(stressPage);
    await page.waitForTimeout(100);
    const problems = await page.evaluate(findOverflows);
    const name = route === courseHref ? '/course' : route === lessonHref ? '/lesson' : route;
    const label = route.endsWith('/practice') ? '/practice' : name;
    console.log(`${problems.length ? 'FAIL' : 'ok  '} ${width}px ${label} (${stressed} chữ)`);
    for (const p of problems) console.log(`     ${p}`);
    failed += problems.length;
    if (shots) {
      const file = `${width}${label.replaceAll('/', '-')}.png`;
      await page.screenshot({ path: join(shots, file), fullPage: true });
    }
  }
}

await browser.close();
console.log(failed ? `\n${failed} chỗ tràn.` : '\nKhông có chỗ tràn.');
process.exit(failed ? 1 : 0);
