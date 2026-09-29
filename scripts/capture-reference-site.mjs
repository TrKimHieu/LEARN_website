/**
 * Chụp ảnh + đo thông số giao diện của một trang web bất kỳ, chạy trong Edge đã
 * đăng nhập sẵn (nối qua DevTools Protocol, KHÔNG cần Playwright tự tải browser).
 *
 * Mục đích: tham khảo bố cục / thang spacing / typography / component inventory
 * khi thiết kế giao diện LearnFlow. Script **không** tải về source hay asset
 * của trang đích — chỉ ghi ảnh chụp và số đo đọc từ computed style.
 *
 * Yêu cầu: Edge phải chạy với `--remote-debugging-port=9222`:
 *   & "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" `
 *       --remote-debugging-port=9222
 *
 * Dùng:
 *   node scripts/capture-reference-site.mjs https://quizlet.com/latest
 *   node scripts/capture-reference-site.mjs --slug quizlet --width 1440,390 <url>
 *   node scripts/capture-reference-site.mjs --out docs/references/x --full <url>
 *
 * Ghi ra:
 *   <out>/<slug>/shots/*.png     ảnh chụp
 *   <out>/<slug>/measurements.json  số đo thô
 *   <out>/<slug>/notes.md          bản tóm tắt đọc được
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const CDP_URL = process.env.CDP_URL ?? 'http://127.0.0.1:9222';

function parseArgs(argv) {
  const opts = { url: null, slug: null, out: 'docs/references', widths: [1440, 390], full: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--slug') opts.slug = argv[(i += 1)];
    else if (arg === '--out') opts.out = argv[(i += 1)];
    else if (arg === '--width') opts.widths = argv[(i += 1)].split(',').map(Number);
    else if (arg === '--viewport-only') opts.full = false;
    else if (arg.startsWith('http')) opts.url = arg;
    else throw new Error(`Tham số lạ: ${arg}`);
  }
  if (!opts.url) throw new Error('Thiếu URL, ví dụ: node scripts/capture-reference-site.mjs https://quizlet.com/latest');
  if (!opts.slug) {
    opts.slug = new URL(opts.url).hostname.replace(/^www\./, '').split('.')[0];
  }
  return opts;
}

/** Chạy trong trang: gom số đo computed style của các phần tử đang hiển thị. */
function collectMeasurements() {
  const bump = (obj, key) => {
    if (!key || key === 'none' || key === 'normal' || key === '0px' || key === 'auto') return;
    obj[key] = (obj[key] ?? 0) + 1;
  };
  const top = (obj, n) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([value, count]) => ({ value, count }));

  const buckets = {
    color: {},
    backgroundColor: {},
    borderColor: {},
    fontFamily: {},
    fontSize: {},
    fontWeight: {},
    lineHeight: {},
    letterSpacing: {},
    borderRadius: {},
    boxShadow: {},
    gap: {},
    padding: {},
    margin: {},
    maxWidth: {},
    zIndex: {},
    transitionDuration: {},
  };

  const containers = [];
  const nodes = Array.from(document.querySelectorAll('body *')).slice(0, 8000);

  for (const el of nodes) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue;
    const isBody = el === document.body;

    bump(buckets.color, cs.color);
    bump(buckets.backgroundColor, isBody ? cs.backgroundColor : cs.backgroundColor);
    bump(buckets.borderColor, cs.borderTopColor);
    bump(buckets.fontFamily, cs.fontFamily);
    bump(buckets.fontSize, cs.fontSize);
    bump(buckets.fontWeight, cs.fontWeight);
    bump(buckets.lineHeight, cs.lineHeight);
    bump(buckets.letterSpacing, cs.letterSpacing);
    bump(buckets.borderRadius, cs.borderRadius);
    bump(buckets.boxShadow, cs.boxShadow);
    bump(buckets.gap, cs.rowGap === cs.columnGap ? cs.rowGap : `${cs.rowGap}/${cs.columnGap}`);
    bump(buckets.padding, cs.padding);
    bump(buckets.margin, cs.margin);
    bump(buckets.maxWidth, cs.maxWidth);
    bump(buckets.zIndex, cs.zIndex);
    bump(buckets.transitionDuration, cs.transitionDuration);

    // Wrapper bố cục: phần tử rộng, có max-width, và là grid/flex.
    if (
      (cs.display === 'grid' || cs.display === 'flex' || cs.display === 'inline-flex') &&
      (cs.maxWidth !== 'none' || rect.width > 400)
    ) {
      containers.push({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') ?? null,
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        flexDirection: cs.flexDirection,
        gap: cs.gap,
        maxWidth: cs.maxWidth,
        padding: cs.padding,
        width: Math.round(rect.width),
        classHint: (el.className || '').toString().split(/\s+/).filter(Boolean).length
          ? (el.className || '').toString().split(/\s+/).slice(0, 3).join('.')
          : null,
      });
    }
  }

  // Khung cảnh: vùng bố cục chính + điều hướng + tiêu đề.
  const landmarks = Array.from(
    document.querySelectorAll('header, nav, main, section, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"]'),
  )
    .filter((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return cs.display !== 'none' && rect.width > 2 && rect.height > 2;
    })
    .slice(0, 60)
    .map((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') ?? null,
        label: el.getAttribute('aria-label') ?? null,
        heading: el.querySelector('h1,h2,h3')?.textContent?.trim().slice(0, 80) ?? null,
        position: cs.position,
        sticky: cs.position === 'sticky' || cs.position === 'fixed',
        backgroundColor: cs.backgroundColor,
        height: Math.round(rect.height),
        width: Math.round(rect.width),
        padding: cs.padding,
        children: el.children.length,
      };
    });

  const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4'))
    .slice(0, 80)
    .map((el) => {
      const cs = getComputedStyle(el);
      return {
        level: el.tagName.toLowerCase(),
        text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 100) ?? '',
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
      };
    });

  const controls = Array.from(
    document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]'),
  )
    .filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 2 && rect.height > 2 && getComputedStyle(el).visibility !== 'hidden';
    })
    .slice(0, 300)
    .map((el) => {
      const cs = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') ?? null,
        text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) ?? '',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        backgroundColor: cs.backgroundColor,
        border: cs.borderTopWidth === '0px' ? 'none' : `${cs.borderTopWidth} ${cs.borderTopStyle}`,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
      };
    });

  return {
    title: document.title,
    url: location.href,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    documentHeight: document.documentElement.scrollHeight,
    bodyFont: getComputedStyle(document.body).fontFamily,
    lang: document.documentElement.lang,
    landmarks,
    headings,
    controls,
    containers: containers.slice(0, 120),
    tokens: Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, top(v, 24)])),
  };
}

/** Mở rộng bề cao trang để chụp full-page, nhưng giữ nguyên chiều rộng thiết bị. */
async function setFullPageHeight(page, height) {
  const session = await page.context().newCDPSession(page);
  const { windowId } = await session.send('Browser.getWindowForTarget');
  const { bounds } = await session.send('Browser.getWindowBounds', { windowId });
  await session.send('Browser.setWindowBounds', {
    windowId,
    bounds: { ...bounds, height: Math.min(height, 16000) },
  });
  await page.waitForTimeout(600);
  await session.detach();
  return async () => {
    const s2 = await page.context().newCDPSession(page);
    const { windowId: w2 } = await s2.send('Browser.getWindowForTarget');
    await s2.send('Browser.setWindowBounds', { windowId: w2, bounds });
    await s2.detach();
  };
}

function fmtTable(rows, head) {
  const lines = [`| ${head} | dùng lần |`, '| --- | --- |'];
  for (const { value, count } of rows) lines.push(`| \`${value}\` | ${count} |`);
  return lines.join('\n');
}

function buildNotes(data, shots) {
  const parts = [];
  parts.push(`# ${data.title || '(không có tiêu đề)'}`);
  parts.push(`- Nguồn: ${data.url}`);
  parts.push(`- Ngày chụp: ${new Date().toISOString().slice(0, 10)} (qua phiên Edge đã đăng nhập)`);
  parts.push(`- Viewport: ${data.viewport.width}×${data.viewport.height}, chiều cao trang ${data.documentHeight}px`);
  parts.push(`- Chỉ ghi **số đo** và ảnh chụp để tham khảo bố cục. Không sao chép source/asset của trang đích.`);
  parts.push('');
  parts.push('## Ảnh chụp');
  for (const s of shots) parts.push(`- \`${s}\``);
  parts.push('');
  parts.push('## Khung cảnh (landmarks)');
  parts.push('| tag | vai trò | nhãn | tiêu đề con | dính | cao | nền | padding |');
  parts.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const l of data.landmarks) {
    parts.push(
      `| ${l.tag} | ${l.role ?? '-'} | ${l.label ?? '-'} | ${(l.heading ?? '-').replace(/\|/g, '/')} | ${l.sticky ? 'có' : 'không'} | ${l.height} | ${l.backgroundColor} | ${l.padding} |`,
    );
  }
  parts.push('');
  parts.push('## Thang typography');
  parts.push('Font chữ: `' + data.bodyFont + '`');
  parts.push('');
  parts.push(fmtTable(data.tokens.fontSize, 'font-size'));
  parts.push('');
  parts.push(fmtTable(data.tokens.fontWeight, 'font-weight'));
  parts.push('');
  parts.push(fmtTable(data.tokens.lineHeight, 'line-height'));
  parts.push('');
  parts.push('## Màu');
  parts.push('### Chữ');
  parts.push(fmtTable(data.tokens.color, 'color'));
  parts.push('');
  parts.push('### Nền');
  parts.push(fmtTable(data.tokens.backgroundColor, 'background-color'));
  parts.push('');
  parts.push('### Viền');
  parts.push(fmtTable(data.tokens.borderColor, 'border-color'));
  parts.push('');
  parts.push('## Hình học');
  parts.push('### Bo góc');
  parts.push(fmtTable(data.tokens.borderRadius, 'border-radius'));
  parts.push('');
  parts.push('### Khoảng cách (padding)');
  parts.push(fmtTable(data.tokens.padding, 'padding'));
  parts.push('');
  parts.push('### Khoảng cách (gap)');
  parts.push(fmtTable(data.tokens.gap, 'gap'));
  parts.push('');
  parts.push('### Bề rộng chặn (max-width)');
  parts.push(fmtTable(data.tokens.maxWidth, 'max-width'));
  parts.push('');
  parts.push('### Đổ bóng');
  parts.push(fmtTable(data.tokens.boxShadow, 'box-shadow'));
  parts.push('');
  parts.push('## Tiêu đề trong trang');
  parts.push('| cấp | nội dung | size | weight | line-height | tracking |');
  parts.push('| --- | --- | --- | --- | --- | --- |');
  for (const h of data.headings) {
    parts.push(
      `| ${h.level} | ${h.text.replace(/\|/g, '/')} | ${h.fontSize} | ${h.fontWeight} | ${h.lineHeight} | ${h.letterSpacing} |`,
    );
  }
  parts.push('');
  parts.push('## Nút / control (mẫu 40 đầu)');
  parts.push('| tag | vai trò | nhãn | kích thước | padding | bo góc | nền | viền | cỡ chữ |');
  parts.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const c of data.controls.slice(0, 40)) {
    parts.push(
      `| ${c.tag} | ${c.role ?? '-'} | ${c.text.replace(/\|/g, '/') || '-'} | ${c.width}×${c.height} | ${c.padding} | ${c.borderRadius} | ${c.backgroundColor} | ${c.border} | ${c.fontSize} |`,
    );
  }
  parts.push('');
  parts.push('## Khung chứa bố cục (mẫu 25 đầu)');
  parts.push('| tag | hiển thị | cột | hướng | gap | max-width | rộng | padding |');
  parts.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const c of data.containers.slice(0, 25)) {
    parts.push(
      `| ${c.tag} | ${c.display} | ${c.gridTemplateColumns} | ${c.flexDirection} | ${c.gap} | ${c.maxWidth} | ${c.width} | ${c.padding} |`,
    );
  }
  return parts.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(REPO_ROOT, opts.out, opts.slug);
  const shotDir = path.join(outDir, 'shots');
  mkdirSync(shotDir, { recursive: true });

  const browser = await chromium.connectOverCDP(CDP_URL);
  const context = browser.contexts()[0];
  if (!context) throw new Error(`Không tìm thấy context nào. Edge có đang chạy với --remote-debugging-port=9222?`);

  const page = await context.newPage();
  const shots = [];

  try {
    await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Cuộn hết trang để kích hoạt lazy-load, rồi về đầu trang trước khi chụp.
    await page.waitForTimeout(2500);
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(1500);

    // Kích thước cửa sổ gốc, để trả lại sau khi chụp xong.
    const originalViewport = page.viewportSize() ?? { width: 1440, height: 900 };

    for (const width of opts.widths) {
      const label = width > 700 ? 'desktop' : 'mobile';
      // Ép chiều rộng TRƯỚC rồi mới đo, nếu không sẽ dùng nhầm bề rộng cửa sổ thật.
      await page.setViewportSize({ width, height: originalViewport.height });
      await page.waitForTimeout(1500);

      const metrics = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }));

      if (opts.full) {
        const restore = await setFullPageHeight(page, metrics.h + 40);
        await page.waitForTimeout(800);
        const file = path.join(shotDir, `${label}-${metrics.w}-full.png`);
        await page.screenshot({ path: file, fullPage: true, scale: 'css' });
        shots.push(path.relative(outDir, file).replace(/\\/g, '/'));
        console.log(`  ✓ full-page ${metrics.w}px -> ${path.relative(REPO_ROOT, file)}`);
        await restore();
      }

      // Ảnh viewport tại đầu trang — dùng để nhìn tỷ lệ, độ dày header, khoảng thở.
      const top = path.join(shotDir, `${label}-${metrics.w}-top.png`);
      await page.screenshot({ path: top, scale: 'css' });
      shots.push(path.relative(outDir, top).replace(/\\/g, '/'));
      console.log(`  ✓ viewport ${metrics.w}px -> ${path.relative(REPO_ROOT, top)}`);
    }

    await page.setViewportSize(originalViewport);
    await page.waitForTimeout(1000);
    const data = await page.evaluate(collectMeasurements);

    writeFileSync(path.join(outDir, 'measurements.json'), JSON.stringify(data, null, 2), 'utf8');
    writeFileSync(path.join(outDir, 'notes.md'), buildNotes(data, shots), 'utf8');
    console.log(`\n  ✓ ${path.relative(REPO_ROOT, path.join(outDir, 'notes.md'))}`);
    console.log(`  ✓ ${path.relative(REPO_ROOT, path.join(outDir, 'measurements.json'))}`);
  } finally {
    await page.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
