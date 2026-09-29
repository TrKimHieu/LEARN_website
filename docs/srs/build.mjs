/**
 * Sinh `LEARN-SRS-v1.0.docx` từ nguồn trong thư mục này.
 *
 *   npm run docs:srs                          # từ gốc repo
 *   node docs/srs/build.mjs --force           # render lại mọi sơ đồ
 *   node docs/srs/build.mjs --shots=1,5,12    # thêm ảnh trang (build/pages/) để soát bố cục
 *   node docs/srs/build.mjs --no-word         # bỏ bước Word (mục lục tự cập nhật khi mở file)
 *
 * Luồng:
 *   1. diagrams/*.mmd  --(Chromium + Mermaid)-->  diagrams/png/*.png   (2.5x, chỉ khi .mmd mới hơn)
 *   2. content/*.html (theo thứ tự tên) + Data Dictionary sinh từ schema.prisma  --> build/srs.html
 *      (đánh số Hình/Bảng ở bước này)
 *   3. build/srs.html  --(Chromium parse DOM → cây khối → thư viện docx)-->  LEARN-SRS-v1.0.docx
 *   4. Nếu có Microsoft Word (Windows): cập nhật mục lục + số trang, lưu lại, xuất build/preview.pdf.
 *
 * Cần Internet khi render sơ đồ (Mermaid nạp từ CDN). Thư viện `docx` cài riêng trong thư mục
 * này (`npm install --prefix docs/srs`), không đụng lockfile của workspace.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDataDictionary } from './data-dictionary.mjs';
import { DocxBuilder, serializeInBrowser } from './docx-writer.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(ROOT, '..', '..');
const DIAGRAM_DIR = path.join(ROOT, 'diagrams');
const PNG_DIR = path.join(DIAGRAM_DIR, 'png');
const CONTENT_DIR = path.join(ROOT, 'content');
const BUILD_DIR = path.join(ROOT, 'build');
const OUT_DOCX = path.join(ROOT, 'LEARN-SRS-v1.0.docx');
const PREVIEW_PDF = path.join(BUILD_DIR, 'preview.pdf');

const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.min.js';
const DIAGRAM_SCALE = 2.5;

const args = new Set(process.argv.slice(2));
const argValue = (name) => [...args].find((a) => a.startsWith(`--${name}=`))?.split('=')[1];

// ─── 1. Sơ đồ ─────────────────────────────────────────────────────────

const MERMAID_CONFIG = {
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'Segoe UI, sans-serif',
  themeVariables: {
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '15px',
    primaryColor: '#f4f4f5',
    primaryBorderColor: '#3f3f46',
    primaryTextColor: '#18181b',
    secondaryColor: '#e4e4e7',
    tertiaryColor: '#fafafa',
    lineColor: '#52525b',
    textColor: '#18181b',
    mainBkg: '#f4f4f5',
    nodeBorder: '#3f3f46',
    clusterBkg: '#fafafa',
    clusterBorder: '#a1a1aa',
    titleColor: '#18181b',
    actorBkg: '#18181b',
    actorBorder: '#18181b',
    actorTextColor: '#ffffff',
    actorLineColor: '#a1a1aa',
    signalColor: '#27272a',
    signalTextColor: '#18181b',
    labelBoxBkgColor: '#18181b',
    labelBoxBorderColor: '#18181b',
    labelTextColor: '#ffffff',
    loopTextColor: '#18181b',
    noteBkgColor: '#fef9c3',
    noteBorderColor: '#a16207',
    noteTextColor: '#18181b',
    activationBkgColor: '#e4e4e7',
    activationBorderColor: '#52525b',
    sequenceNumberColor: '#ffffff',
    edgeLabelBackground: '#ffffff',
    attributeBackgroundColorOdd: '#ffffff',
    attributeBackgroundColorEven: '#f4f4f5',
  },
  sequence: {
    mirrorActors: false,
    showSequenceNumbers: true,
    actorMargin: 36,
    messageFontSize: 16,
    noteFontSize: 14,
    actorFontSize: 15,
    wrap: true,
    width: 150,
  },
  flowchart: { curve: 'basis', padding: 14, htmlLabels: true, nodeSpacing: 40, rankSpacing: 50 },
  er: { fontSize: 13, layoutDirection: 'TB', minEntityWidth: 90 },
  state: { padding: 10 },
};

async function renderDiagrams(browser) {
  mkdirSync(PNG_DIR, { recursive: true });
  const sources = readdirSync(DIAGRAM_DIR).filter((f) => f.endsWith('.mmd'));
  const todo = sources.filter((f) => {
    const png = path.join(PNG_DIR, f.replace(/\.mmd$/, '.png'));
    return (
      args.has('--force') ||
      !existsSync(png) ||
      statSync(png).mtimeMs < statSync(path.join(DIAGRAM_DIR, f)).mtimeMs
    );
  });
  if (todo.length === 0) {
    console.log(`Sơ đồ: ${sources.length} ảnh đã mới, bỏ qua.`);
    return;
  }

  const page = await browser.newPage({ deviceScaleFactor: DIAGRAM_SCALE, viewport: { width: 1600, height: 900 } });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8">
     <style>body{margin:0;background:#fff;font-family:'Segoe UI',sans-serif}
     #out{display:inline-block;padding:14px;background:#fff}</style>
     <script src="${MERMAID_URL}"></script></head>
     <body><div id="out"></div></body></html>`,
    { waitUntil: 'networkidle' },
  );
  await page.evaluate((cfg) => window.mermaid.initialize(cfg), MERMAID_CONFIG);

  for (const file of todo) {
    const src = readFileSync(path.join(DIAGRAM_DIR, file), 'utf8');
    try {
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.evaluate(
        async ({ code, id }) => {
          const { svg } = await window.mermaid.render(id, code);
          const out = document.getElementById('out');
          out.innerHTML = svg;
          // Mermaid để width="100%" + max-width theo khung chứa; trong khung inline-block điều đó co
          // SVG về ~300px và ảnh bị mờ. Đặt kích thước tuyệt đối theo viewBox.
          const el = out.querySelector('svg');
          const [, , vw, vh] = el.getAttribute('viewBox').split(/[\s,]+/).map(Number);
          el.style.maxWidth = 'none';
          el.setAttribute('width', String(vw));
          el.setAttribute('height', String(vh));
        },
        { code: src, id: 'd' + file.replace(/\W/g, '') },
      );
      const box = await page.locator('#out').boundingBox();
      await page.setViewportSize({
        width: Math.max(400, Math.ceil(box.width) + 20),
        height: Math.max(300, Math.ceil(box.height) + 20),
      });
      await page.locator('#out').screenshot({ path: path.join(PNG_DIR, file.replace(/\.mmd$/, '.png')) });
      console.log(`  ✓ ${file}  (${Math.round(box.width)}×${Math.round(box.height)} px)`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message.split('\n')[0]}`);
      process.exitCode = 1;
    }
  }
  await page.close();
}

// ─── 2. Ghép HTML ─────────────────────────────────────────────────────

function assembleHtml() {
  const parts = readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => readFileSync(path.join(CONTENT_DIR, f), 'utf8'));
  let body = parts.join('\n');

  body = body.replace('<!-- DATA_DICTIONARY -->', () =>
    renderDataDictionary(readFileSync(path.join(REPO, 'packages/db/prisma/schema.prisma'), 'utf8')),
  );

  // Đánh số Hình / Bảng theo thứ tự xuất hiện.
  let fig = 0;
  body = body.replace(/<figcaption>/g, () => `<figcaption><b>Hình ${++fig}.</b> `);
  let tab = 0;
  body = body.replace(/<caption>/g, () => `<caption><b>Bảng ${++tab}.</b> `);

  // Ảnh trỏ tương đối từ build/srs.html.
  body = body.replace(/src="diagrams\//g, 'src="../diagrams/');

  mkdirSync(BUILD_DIR, { recursive: true });
  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><title>LEARN — SRS</title></head>
<body>
${body}
</body></html>`;
  writeFileSync(path.join(BUILD_DIR, 'srs.html'), html);
  console.log(`HTML: ${fig} hình, ${tab} bảng.`);
}

// ─── 3. DOCX ──────────────────────────────────────────────────────────

/** Server tĩnh tối giản: phục vụ build/ và pdf.js (cho bước xem trước). */
function serve() {
  const types = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.mjs': 'text/javascript', '.pdf': 'application/pdf' };
  const mounts = [
    ['/pdfjs/', path.join(REPO, 'node_modules', 'pdfjs-dist', 'build')],
    ['/', ROOT],
  ];
  const server = createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const [prefix, dir] = mounts.find(([p]) => url.startsWith(p));
    const file = path.join(dir, url.slice(prefix.length));
    if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function writeDocx(browser, base, useWord) {
  const page = await browser.newPage();
  await page.goto(`${base}/build/srs.html`);
  const tree = await page.evaluate(serializeInBrowser);
  await page.close();

  const builder = new DocxBuilder({
    root: ROOT,
    headerLeft: 'LEARN — Software Requirements Specification',
    headerRight: 'v1.0',
    footerLeft: 'LEARN SRS v1.0 · 2026-09-28',
    useTocField: useWord,
  });
  const buf = await builder.build(tree);
  writeFileSync(OUT_DOCX, buf);
  for (const w of builder.warnings) console.warn('  ⚠', w);
  console.log(`DOCX: ${(buf.length / 1024).toFixed(0)} KB → ${path.relative(REPO, OUT_DOCX)}`);
}

// ─── 4. Word + xem trước ──────────────────────────────────────────────

function hasWord() {
  if (process.platform !== 'win32' || args.has('--no-word')) return false;
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', '$w=New-Object -ComObject Word.Application;$w.Quit()'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function finalizeWithWord() {
  const out = execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'word-finalize.ps1'), '-Docx', OUT_DOCX, '-Pdf', PREVIEW_PDF],
    { encoding: 'utf8' },
  );
  console.log(`Word: đã cập nhật mục lục, ${/pages=(\d+)/.exec(out)?.[1] ?? '?'} trang → ${path.relative(REPO, PREVIEW_PDF)}`);
}

async function pageShots(browser, base) {
  const spec = argValue('shots');
  if (!spec || !existsSync(PREVIEW_PDF)) return;
  const dir = path.join(BUILD_DIR, 'pages');
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.goto(`${base}/build/srs.html`);
  const shots = await page.evaluate(
    async ({ spec }) => {
      const pdfjs = await import('/pdfjs/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.mjs';
      const pdf = await pdfjs.getDocument('/build/preview.pdf').promise;
      const wanted = spec === 'all' ? [...Array(pdf.numPages).keys()].map((i) => i + 1) : spec.split(',').map(Number);
      const out = [];
      for (const n of wanted.filter((n) => n >= 1 && n <= pdf.numPages)) {
        const p = await pdf.getPage(n);
        const vp = p.getViewport({ scale: 1.6 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        out.push({ n, data: canvas.toDataURL('image/png').split(',')[1] });
      }
      return out;
    },
    { spec },
  );
  for (const s of shots) writeFileSync(path.join(dir, `p-${String(s.n).padStart(3, '0')}.png`), Buffer.from(s.data, 'base64'));
  await page.close();
  console.log(`Ảnh trang: ${shots.length} → ${path.relative(REPO, dir)}`);
}

// ─── main ─────────────────────────────────────────────────────────────

const browser = await chromium.launch({ args: ['--disable-lcd-text', '--force-color-profile=srgb'] });
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
try {
  await renderDiagrams(browser);
  assembleHtml();
  const useWord = hasWord();
  await writeDocx(browser, base, useWord);
  if (useWord) {
    finalizeWithWord();
    await pageShots(browser, base);
  } else {
    console.log('Không có Microsoft Word: mục lục sẽ được cập nhật khi mở file (Word hỏi "update fields").');
  }
} finally {
  server.close();
  await browser.close();
}
