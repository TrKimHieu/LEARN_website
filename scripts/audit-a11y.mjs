/**
 * Audit accessibility tự động bằng axe-core trên **màn thật đã đăng nhập**.
 *
 * Khác `eslint-plugin-jsx-a11y` (phân tích tĩnh, chỉ thấy JSX): axe chạy trên DOM
 * đã render nên bắt được những thứ tĩnh không thấy — tương phản màu thật sau khi
 * Tailwind tính xong, thứ tự heading, vai trò ARIA sai ngữ cảnh, tên gọi của
 * control sinh động.
 *
 * Yêu cầu: `npm run dev` (web + api + worker) và hạ tầng docker đang chạy,
 * database đã seed.
 *
 * Chạy:  node scripts/audit-a11y.mjs
 * Ra:    bảng vi phạm ở stdout; exit code 1 nếu có vi phạm serious/critical.
 */
import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const BASE = process.env.WEB_URL ?? 'http://localhost:3000';

/** WCAG 2.2 AA — đúng mức LEARN nhắm tới. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const LEARNER = { email: 'demo@learn.ai', password: 'Demo@12345' };
const ADMIN = { email: 'admin@learn.ai', password: 'Admin@12345' };

const ANON_ROUTES = ['/', '/login', '/register', '/forgot-password'];
const LEARNER_ROUTES = ['/dashboard', '/courses', '/courses/new', '/progress', '/settings'];
const ADMIN_ROUTES = [
  '/admin',
  '/admin/ai-jobs',
  '/admin/courses',
  '/admin/metrics',
  '/admin/subscriptions',
  '/admin/users',
];

/**
 * Mọi context đều bật `reducedMotion: 'reduce'`.
 *
 * Không phải để kiểm tra chế độ giảm chuyển động, mà để kết quả **ổn định**:
 * vòng nhấn của bài đang học (`lesson-path.tsx`) phóng to 6% theo chu kỳ, và nếu
 * axe lấy mẫu đúng lúc nó đang nở thì nó phủ lên nhãn bên dưới và làm phép tính
 * tương phản ra kết quả khác. Đã bắt gặp một lần: cùng một trang, chạy lại ba
 * lần thì hai lần sạch. Một audit chạy đua với animation sẽ làm CI đỏ ngẫu
 * nhiên. `reduce` khiến `MotionConfig` bỏ transform/scale nên trang đứng yên ở
 * trạng thái nghỉ — đúng trạng thái cần đo.
 */
const CONTEXT = { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' };

async function login(page, { email, password }) {
  await page.goto(`${BASE}/login`);
  await page.getByLabel('Email').fill(email);
  // `exact: true` là bắt buộc kể từ khi ô mật khẩu có nút hiện/ẩn: nhãn của nút
  // ("Hiện mật khẩu") chứa chuỗi "Mật khẩu", nên khớp lỏng sẽ trúng cả hai.
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 20000 });
}

async function scan(page, route, results) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page
    .locator('.animate-pulse')
    .first()
    .waitFor({ state: 'detached', timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(600);

  // Trang chủ có section dùng `RevealOnScroll`/`StaggerOnScroll` (lib/motion.tsx) —
  // chờ IntersectionObserver thật hoặc lưới an toàn 1s mới hiện, chứ không hiện
  // ngay lúc mount. Một trang không cuộn qua sẽ bị axe chấm cả những section đó ở
  // trạng thái "ẩn" (`opacity-60`) — tương phản thấp không phải vì màu sai, mà vì
  // nội dung đang cố ý mờ đi chờ cuộn tới. Cuộn hết trang mô phỏng đúng một người
  // dùng thật đã xem hết, rồi mới audit.
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight, 400);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);

  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations) {
    results.push({
      route,
      id: v.id,
      impact: v.impact ?? 'unknown',
      help: v.help,
      nodes: v.nodes.length,
      sample: (v.nodes[0]?.html ?? '').slice(0, 160),
    });
  }
  const worst = violations.filter((v) => v.impact === 'critical' || v.impact === 'serious').length;
  console.log(`  ${worst > 0 ? '✗' : '✓'} ${route} — ${violations.length} vi phạm`);
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  const anon = await browser.newContext(CONTEXT);
  const ap = await anon.newPage();
  for (const r of ANON_ROUTES) await scan(ap, r, results);

  const learner = await browser.newContext(CONTEXT);
  const lp = await learner.newPage();
  await login(lp, LEARNER);
  for (const r of LEARNER_ROUTES) await scan(lp, r, results);

  // Chi tiết khóa học → bài học → bài tập: id động nên phải đi theo link thật.
  await lp.goto(`${BASE}/courses`, { waitUntil: 'networkidle' });
  const courseHref = await lp
    .locator('a[href^="/courses/"]:not([href="/courses/new"])')
    .first()
    .getAttribute('href');
  if (courseHref) {
    await scan(lp, courseHref, results);
    await lp.goto(`${BASE}${courseHref}`, { waitUntil: 'networkidle' });
    const lessonHref = await lp.locator('a[href*="/lessons/"]').first().getAttribute('href');
    if (lessonHref) {
      await scan(lp, lessonHref, results);
      await scan(lp, `${lessonHref}/practice`, results);
    }
  }

  const admin = await browser.newContext(CONTEXT);
  const adp = await admin.newPage();
  await login(adp, ADMIN);
  for (const r of ADMIN_ROUTES) await scan(adp, r, results);

  await browser.close();

  console.log('\n──────────── Tổng hợp ────────────');
  if (results.length === 0) {
    console.log('Không có vi phạm nào.');
    return;
  }

  // Gom theo luật: một lỗi ở primitive dùng chung sẽ lặp trên mọi màn, gom lại
  // để thấy đúng số lỗi *cần sửa* thay vì số lần nó xuất hiện.
  const byRule = new Map();
  for (const r of results) {
    const cur = byRule.get(r.id) ?? { ...r, routes: new Set(), total: 0 };
    cur.routes.add(r.route);
    cur.total += r.nodes;
    byRule.set(r.id, cur);
  }

  const order = { critical: 0, serious: 1, moderate: 2, minor: 3, unknown: 4 };
  const rules = [...byRule.values()].sort((a, b) => order[a.impact] - order[b.impact]);

  for (const r of rules) {
    console.log(`\n[${r.impact}] ${r.id} — ${r.help}`);
    console.log(`  ${r.total} phần tử trên ${r.routes.size} màn: ${[...r.routes].join(', ')}`);
    console.log(`  ví dụ: ${r.sample}`);
  }

  const blocking = rules.filter((r) => r.impact === 'critical' || r.impact === 'serious');
  console.log(`\n${rules.length} luật bị vi phạm, ${blocking.length} ở mức serious/critical.`);
  if (blocking.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
