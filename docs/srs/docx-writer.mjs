/**
 * HTML nguồn (tập con có kiểm soát) → .docx bằng thư viện `docx`.
 *
 * Bước 1 `serializeInBrowser` chạy TRONG Chromium: trình duyệt parse HTML chuẩn, hàm này đi cây
 * DOM và trả về một cây khối (heading, đoạn, bảng, hình, danh sách…) dạng JSON.
 * Bước 2 `writeDocx` dựng tài liệu Word từ cây đó.
 *
 * Tập thẻ hỗ trợ: section.cover|front|chapter, h1–h4, p, ul/ol/li, table (caption, colgroup,
 * thead, tbody, colspan), figure>img+figcaption, pre, div.callout, div.label, div.fn, và inline
 * b/strong/i/em/code/a/br + span.st.* (nhãn trạng thái), span.m.* (HTTP method), span.tag.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  PageBreak,
  PageNumber,
  PageOrientation,
  Packer,
  Paragraph,
  PositionalTab,
  PositionalTabAlignment,
  PositionalTabLeader,
  PositionalTabRelativeTo,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableOfContents,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// ─── 1. DOM → cây khối (chạy trong trình duyệt) ────────────────────────

export function serializeInBrowser() {
  const INLINE_STYLE = {
    B: { b: true },
    STRONG: { b: true },
    I: { i: true },
    EM: { i: true },
    CODE: { code: true },
    SMALL: { small: true },
  };

  function runs(node, fmt = {}, out = []) {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) {
        const text = child.textContent.replace(/\s+/g, ' ');
        if (text) out.push({ text, ...fmt });
      } else if (child.nodeType === 1) {
        const el = child;
        if (el.tagName === 'BR') {
          out.push({ br: true });
          continue;
        }
        const next = { ...fmt, ...(INLINE_STYLE[el.tagName] || {}) };
        if (el.classList.contains('st')) next.pill = 'st-' + [...el.classList].find((c) => c !== 'st');
        if (el.classList.contains('m')) next.pill = 'm-' + [...el.classList].find((c) => c !== 'm');
        if (el.classList.contains('tag')) next.pill = 'tag';
        if (el.classList.contains('note')) {
          out.push({ br: true });
          next.note = true;
        }
        if (el.classList.contains('num')) next.accent = true;
        if (el.classList.contains('en')) next.muted = true;
        runs(el, next, out);
      }
    }
    // gộp khoảng trắng đầu/cuối
    if (out.length && out[0].text) out[0].text = out[0].text.replace(/^\s+/, '');
    const last = out[out.length - 1];
    if (last && last.text) last.text = last.text.replace(/\s+$/, '');
    return out.filter((r) => r.br || r.text);
  }

  function list(el, ordered) {
    return {
      t: 'list',
      ordered,
      items: [...el.children]
        .filter((li) => li.tagName === 'LI')
        .map((li) => {
          const clone = li.cloneNode(true);
          clone.querySelectorAll(':scope > ul, :scope > ol').forEach((n) => n.remove());
          const sub = [...li.children].filter((c) => c.tagName === 'UL' || c.tagName === 'OL');
          return { runs: runs(clone), sub: sub.map((s) => list(s, s.tagName === 'OL')) };
        }),
    };
  }

  function cellContent(td) {
    const hasBlocks = [...td.children].some((c) => ['P', 'UL', 'OL', 'PRE'].includes(c.tagName));
    if (!hasBlocks) return [{ t: 'p', runs: runs(td) }];
    return blocks(td);
  }

  function table(el) {
    const cols = [...el.querySelectorAll(':scope > colgroup > col')].map((c) => {
      const w = /width:\s*([\d.]+)%/.exec(c.getAttribute('style') || '');
      return w ? Number(w[1]) : null;
    });
    const rowOf = (tr) =>
      [...tr.children].map((td) => ({
        blocks: cellContent(td),
        span: Number(td.getAttribute('colspan') || 1),
        center: td.classList.contains('c'),
      }));
    return {
      t: 'table',
      cls: el.className,
      caption: el.querySelector(':scope > caption') ? runs(el.querySelector(':scope > caption')) : null,
      cols,
      head: [...el.querySelectorAll(':scope > thead > tr')].map(rowOf),
      body: [...el.querySelectorAll(':scope > tbody > tr, :scope > tr')].map(rowOf),
    };
  }

  function blocks(root) {
    const out = [];
    for (const el of root.children) {
      const tag = el.tagName;
      const cls = el.className || '';
      if (tag === 'SECTION') {
        out.push({ t: 'section', cls, blocks: blocks(el) });
      } else if (/^H[1-4]$/.test(tag)) {
        out.push({
          t: 'h',
          level: Number(tag[1]),
          notoc: el.hasAttribute('data-notoc'),
          cls,
          runs: runs(el),
        });
      } else if (tag === 'P') {
        out.push({ t: 'p', cls, runs: runs(el) });
      } else if (tag === 'UL' || tag === 'OL') {
        out.push(list(el, tag === 'OL'));
      } else if (tag === 'TABLE') {
        out.push(table(el));
      } else if (tag === 'FIGURE') {
        const img = el.querySelector('img');
        const w = /\bw(\d+)\b/.exec(cls);
        out.push({
          t: 'fig',
          src: img.getAttribute('src'),
          widthPct: w ? Number(w[1]) : 100,
          landscape: /landscape/.test(cls),
          caption: el.querySelector('figcaption') ? runs(el.querySelector('figcaption')) : [],
        });
      } else if (tag === 'PRE') {
        out.push({ t: 'pre', text: el.textContent.replace(/^\n|\n\s*$/g, '') });
      } else if (tag === 'DIV' && cls.includes('callout')) {
        out.push({ t: 'callout', warn: cls.includes('warn'), blocks: blocks(el) });
      } else if (tag === 'DIV' && cls.includes('label')) {
        out.push({ t: 'label', runs: runs(el) });
      } else if (tag === 'DIV' && cls.includes('page-break')) {
        out.push({ t: 'pagebreak' });
      } else if (tag === 'DIV') {
        out.push({ t: 'group', cls, blocks: blocks(el) });
      }
    }
    return out;
  }

  return blocks(document.body);
}

// ─── 2. Cây khối → .docx ───────────────────────────────────────────────

const FONT = 'Segoe UI';
const MONO = 'Consolas';
const INK = '18181B';
const INK2 = '3F3F46';
const MUTED = '71717A';
const LINE = 'D4D4D8';
const FILL = 'F4F4F5';
const FILL_SOFT = 'FAFAFA';
const ACCENT = '1E3A8A';

const PAGE_W = 11906; // A4, DXA
const PAGE_H = 16838;
const MARGIN = 1134; // 2 cm
const CONTENT_W = PAGE_W - 2 * MARGIN; // 9638
const LAND_CONTENT_W = PAGE_H - 2 * MARGIN; // 14570
const PX_PER_DXA = 96 / 1440;

const PILL = {
  'st-mvp': { fill: INK, color: 'FFFFFF', bold: true },
  'st-dev': { fill: 'FFFFFF', color: INK, bold: true, border: INK },
  'st-plan': { fill: 'FFFFFF', color: INK2, bold: true, border: INK2, dashed: true },
  'st-future': { fill: FILL, color: MUTED, bold: true, border: LINE },
  'st-out': { fill: FILL, color: MUTED, bold: true, border: MUTED, dashed: true },
  'm-get': { fill: 'E0E7FF', color: ACCENT, bold: true, mono: true },
  'm-post': { fill: 'DCFCE7', color: '14532D', bold: true, mono: true },
  'm-patch': { fill: 'FEF3C7', color: '78350F', bold: true, mono: true },
  'm-delete': { fill: 'FEE2E2', color: '7F1D1D', bold: true, mono: true },
  tag: { fill: 'EEF2FF', color: ACCENT, bold: true, mono: true },
};

/** size tính theo half-point. */
function textRuns(list, base = {}) {
  const out = [];
  for (const r of list) {
    if (r.br) {
      out.push(new TextRun({ break: 1 }));
      continue;
    }
    const pill = r.pill ? PILL[r.pill] : null;
    const size = r.note || r.small ? Math.round((base.size ?? 20) * 0.9) : base.size;
    const opts = {
      text: pill ? ` ${r.text} ` : r.text,
      bold: r.b || base.bold || pill?.bold || undefined,
      italics: r.i || base.italics || undefined,
      font: r.code || pill?.mono ? MONO : base.font,
      size: r.code || pill?.mono ? Math.round((size ?? 20) * 0.92) : size,
      color: pill?.color ?? (r.accent ? ACCENT : r.muted || r.note ? MUTED : base.color),
    };
    if (pill) {
      opts.shading = { type: ShadingType.CLEAR, fill: pill.fill, color: 'auto' };
      if (pill.border)
        opts.border = {
          style: pill.dashed ? BorderStyle.DASHED : BorderStyle.SINGLE,
          size: 4,
          color: pill.border,
          space: 0,
        };
    } else if (r.code) {
      opts.shading = { type: ShadingType.CLEAR, fill: FILL, color: 'auto' };
    }
    out.push(new TextRun(opts));
  }
  return out;
}

const plain = (list) => list.map((r) => r.text ?? '').join('');

function pngSize(file) {
  const buf = readFileSync(file);
  return { buf, w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

export class DocxBuilder {
  constructor({ root, headerLeft, headerRight, footerLeft, useTocField }) {
    this.root = root;
    this.headerLeft = headerLeft;
    this.headerRight = headerRight;
    this.footerLeft = footerLeft;
    this.useTocField = useTocField;
    this.warnings = [];
  }

  // ── khối ──

  heading(b, { breakBefore }) {
    const level = [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][b.level];
    if (b.notoc) {
      return new Paragraph({
        style: b.level === 1 ? 'FrontTitle' : 'FrontHeading',
        children: textRuns(b.runs),
        pageBreakBefore: breakBefore,
        keepNext: true,
      });
    }
    return new Paragraph({
      heading: level,
      children: textRuns(b.runs),
      pageBreakBefore: breakBefore,
      keepNext: true,
      keepLines: true,
    });
  }

  para(b, ctx = {}) {
    const style = {
      lead: 'Lead',
      'dd-desc': 'DdDesc',
      'dd-constraints': 'DdConstraints',
      confid: 'Small',
      'fn-meta': 'FnMeta',
    }[b.cls];
    return new Paragraph({
      style: style ?? ctx.style,
      children: textRuns(b.runs, ctx.run ?? {}),
      spacing: ctx.spacing,
      alignment: ctx.alignment,
    });
  }

  list(b, level = 0, ctx = {}) {
    const out = [];
    for (const item of b.items) {
      out.push(
        new Paragraph({
          style: ctx.inTable ? 'TableText' : undefined,
          numbering: { reference: b.ordered ? 'ordered' : 'bullets', level },
          children: textRuns(item.runs, ctx.run ?? {}),
          spacing: { after: ctx.inTable ? 20 : 60 },
        }),
      );
      for (const sub of item.sub) out.push(...this.list(sub, level + 1, ctx));
    }
    return out;
  }

  caption(runs, { before, align } = {}) {
    return new Paragraph({
      style: 'Caption',
      children: textRuns(runs),
      keepNext: before,
      alignment: align,
    });
  }

  table(b) {
    const ncols = Math.max(...[...b.head, ...b.body].map((r) => r.reduce((s, c) => s + c.span, 0)), 1);
    let pct = b.cols.length === ncols ? b.cols.slice() : new Array(ncols).fill(null);
    const fixed = pct.filter((p) => p !== null).reduce((s, p) => s + p, 0);
    const free = pct.filter((p) => p === null).length;
    pct = pct.map((p) => (p === null ? (100 - fixed) / Math.max(free, 1) : p));
    const widths = pct.map((p) => Math.round((CONTENT_W * p) / 100));
    widths[widths.length - 1] += CONTENT_W - widths.reduce((s, w) => s + w, 0);

    const small = /\b(dd|compact)\b/.test(b.cls);
    const fontSize = small ? 16 : 17;
    const kv = /\bkv\b/.test(b.cls);
    const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };

    const mkRow = (row, isHead, rowIdx) => {
      let col = 0;
      const cells = row.map((c, ci) => {
        const w = widths.slice(col, col + c.span).reduce((s, x) => s + x, 0);
        col += c.span;
        const fill = isHead ? INK : kv && ci === 0 ? FILL : rowIdx % 2 === 1 ? FILL_SOFT : 'FFFFFF';
        const run = isHead
          ? { size: fontSize, bold: true, color: 'FFFFFF' }
          : { size: fontSize, bold: kv && ci === 0 ? true : undefined };
        const children = [];
        for (const blk of c.blocks) {
          if (blk.t === 'list') children.push(...this.list(blk, 0, { inTable: true, run }));
          else if (blk.t === 'pre') children.push(...this.pre(blk, true));
          else
            children.push(
              new Paragraph({
                style: 'TableText',
                alignment: c.center ? AlignmentType.CENTER : undefined,
                children: textRuns(blk.runs ?? [], run),
              }),
            );
        }
        if (children.length === 0) children.push(new Paragraph({ style: 'TableText', children: [] }));
        return new TableCell({
          width: { size: w, type: WidthType.DXA },
          columnSpan: c.span > 1 ? c.span : undefined,
          shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
          margins: { top: 50, bottom: 50, left: 90, right: 90 },
          verticalAlign: isHead ? VerticalAlign.BOTTOM : VerticalAlign.TOP,
          borders: isHead
            ? { top: { ...border, color: INK }, bottom: { ...border, color: INK }, left: { ...border, color: INK }, right: { ...border, color: INK } }
            : { top: border, bottom: border, left: border, right: border },
          children,
        });
      });
      return new TableRow({ tableHeader: isHead, cantSplit: true, children: cells });
    };

    const out = [];
    if (b.caption) out.push(this.caption(b.caption, { before: true }));
    out.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: widths,
        layout: TableLayoutType.FIXED,
        rows: [...b.head.map((r) => mkRow(r, true, 0)), ...b.body.map((r, i) => mkRow(r, false, i))],
      }),
    );
    out.push(new Paragraph({ style: 'AfterTable', children: [] }));
    return out;
  }

  figure(b) {
    const file = path.resolve(this.root, 'build', b.src);
    let img;
    try {
      img = pngSize(file);
    } catch {
      this.warnings.push(`Thiếu ảnh ${b.src}`);
      return [];
    }
    // Ảnh render ở 2.5x — quy về kích thước CSS rồi co vào khổ nội dung.
    const maxW = (b.landscape ? LAND_CONTENT_W : CONTENT_W) * PX_PER_DXA * (b.widthPct / 100);
    const maxH = b.landscape ? 600 : 900;
    let w = img.w / 2.5;
    let h = img.h / 2.5;
    const scale = Math.min(1, maxW / w, maxH / h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        keepNext: true,
        spacing: { before: 120, after: 60 },
        children: [new ImageRun({ type: 'png', data: img.buf, transformation: { width: w, height: h } })],
      }),
      this.caption(b.caption, { align: AlignmentType.CENTER }),
    ];
  }

  pre(b, inTable = false) {
    const lines = b.text.split('\n');
    return lines.map(
      (line, i) =>
        new Paragraph({
          style: 'Code',
          keepNext: i < lines.length - 1,
          keepLines: true,
          spacing: { before: i === 0 ? 60 : 0, after: i === lines.length - 1 ? (inTable ? 0 : 140) : 0 },
          children: [new TextRun({ text: line.replace(/\t/g, '  ') || ' ' })],
        }),
    );
  }

  callout(b) {
    const color = b.warn ? 'A16207' : ACCENT;
    const fill = b.warn ? 'FEFCE8' : 'F5F7FF';
    const out = [];
    b.blocks.forEach((blk, i) => {
      const common = {
        border: { left: { style: BorderStyle.SINGLE, size: 18, color, space: 8 } },
        shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
        indent: { left: 170, right: 113 },
        spacing: { before: i === 0 ? 80 : 0, after: i === b.blocks.length - 1 ? 160 : 60 },
      };
      if (blk.t === 'list') {
        for (const p of this.list(blk, 0, {})) out.push(p);
      } else {
        out.push(new Paragraph({ ...common, children: textRuns(blk.runs ?? [], { size: 19 }) }));
      }
    });
    return out;
  }

  label(b) {
    return new Paragraph({ style: 'Label', keepNext: true, children: textRuns(b.runs) });
  }

  blocks(list, ctx = { chapter: false }) {
    const out = [];
    let firstH1 = true;
    for (const b of list) {
      switch (b.t) {
        case 'section':
          if (b.cls.includes('cover')) break; // bìa dựng riêng
          out.push(...this.blocks(b.blocks, { chapter: b.cls.includes('chapter'), front: b.cls.includes('front') }));
          break;
        case 'h': {
          const first = b.level === 1 && firstH1;
          if (b.level === 1) firstH1 = false;
          // Mỗi section (front/chapter) sang trang mới — trừ h1 đầu tiên sau bìa (section Word mới đã sang trang).
          const breakBefore = first && (ctx.chapter || ctx.front) && this.seenSectionH1 === true;
          if (first && (ctx.chapter || ctx.front)) this.seenSectionH1 = true;
          out.push(this.heading(b, { breakBefore }));
          break;
        }
        case 'p':
          if (b.cls === 'toc-placeholder') {
            out.push(...this.toc());
          } else out.push(this.para(b));
          break;
        case 'list':
          out.push(...this.list(b));
          break;
        case 'table':
          out.push(...this.table(b));
          break;
        case 'fig':
          if (b.landscape) out.push({ landscape: this.figure(b) });
          else out.push(...this.figure(b));
          break;
        case 'pre':
          out.push(...this.pre(b));
          break;
        case 'callout':
          out.push(...this.callout(b));
          break;
        case 'label':
          out.push(this.label(b));
          break;
        case 'pagebreak':
          out.push(new Paragraph({ children: [new PageBreak()] }));
          break;
        case 'group':
          if (b.cls.includes('fn'))
            out.push(
              new Paragraph({
                style: 'FnRule',
                keepNext: true,
                children: [],
              }),
            );
          out.push(...this.blocks(b.blocks, { ...ctx, nested: true }));
          break;
        default:
      }
    }
    return out;
  }

  /** Tách danh sách phần tử thành các section Word: portrait liên tục, mỗi hình landscape một section riêng. */
  splitSections(children) {
    const sections = [{ landscape: false, children: [] }];
    for (const c of children) {
      if (c && c.landscape) {
        sections.push({ landscape: true, children: c.landscape });
        sections.push({ landscape: false, children: [] });
      } else sections.at(-1).children.push(c);
    }
    return sections.filter((s) => s.children.length > 0);
  }

  toc() {
    return [
      new TableOfContents('Mục lục', { hyperlink: true, headingStyleRange: '1-3' }),
    ];
  }

  // ── bìa ──

  cover(section) {
    const find = (pred) => section.blocks.find(pred);
    const title = find((b) => b.t === 'h');
    const subtitle = find((b) => b.t === 'p' && b.cls === 'subtitle');
    const tagline = find((b) => b.t === 'p' && b.cls === 'tagline');
    const meta = find((b) => b.t === 'table');
    const confid = find((b) => b.t === 'p' && b.cls === 'confid');

    const out = [
      new Paragraph({ spacing: { before: 1100 }, children: [] }),
      new Paragraph({
        children: [new TextRun({ text: 'SOFTWARE REQUIREMENTS SPECIFICATION', size: 18, bold: true, color: MUTED, characterSpacing: 40 })],
        spacing: { after: 240 },
      }),
      new Paragraph({
        children: textRuns(title.runs, { size: 60, bold: true, color: INK }),
        spacing: { after: 200, line: 240 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: INK, space: 10 } },
      }),
      new Paragraph({
        children: textRuns(subtitle.runs, { size: 24, color: INK2 }),
        spacing: { before: 200, after: 1000 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'LEARN', size: 96, bold: true, color: ACCENT })],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: textRuns(tagline.runs, { size: 22, color: INK2 }),
        spacing: { after: 1100 },
      }),
    ];

    const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
    const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    out.push(
      new Table({
        width: { size: 6800, type: WidthType.DXA },
        columnWidths: [2600, 4200],
        layout: TableLayoutType.FIXED,
        rows: meta.body.map(
          (row) =>
            new TableRow({
              children: row.map(
                (c, i) =>
                  new TableCell({
                    width: { size: i === 0 ? 2600 : 4200, type: WidthType.DXA },
                    margins: { top: 80, bottom: 80, left: 0, right: 80 },
                    borders: { top: border, bottom: border, left: none, right: none },
                    children: [
                      new Paragraph({
                        children: textRuns(c.blocks[0].runs, { size: 19, color: i === 0 ? MUTED : INK, bold: i === 0 }),
                      }),
                    ],
                  }),
              ),
            }),
        ),
      }),
    );
    if (confid) out.push(new Paragraph({ spacing: { before: 360 }, children: textRuns(confid.runs, { size: 15, color: MUTED }) }));
    return out;
  }

  // ── tài liệu ──

  async build(tree) {
    const cover = tree.find((b) => b.t === 'section' && b.cls.includes('cover'));
    const rest = tree.filter((b) => b !== cover);

    const headerPara = () => new Paragraph({
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
      children: [
        new TextRun({ text: this.headerLeft, size: 15, color: MUTED }),
        new TextRun({
          children: [
            new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: PositionalTabRelativeTo.MARGIN, leader: PositionalTabLeader.NONE }),
            this.headerRight,
          ],
          size: 15,
          color: MUTED,
        }),
      ],
    });
    const footerPara = () => new Paragraph({
      children: [
        new TextRun({ text: this.footerLeft, size: 15, color: 'A1A1AA' }),
        new TextRun({
          children: [
            new PositionalTab({ alignment: PositionalTabAlignment.RIGHT, relativeTo: PositionalTabRelativeTo.MARGIN, leader: PositionalTabLeader.NONE }),
            'Trang ',
            PageNumber.CURRENT,
            ' / ',
            PageNumber.TOTAL_PAGES,
          ],
          size: 15,
          color: INK2,
        }),
      ],
    });

    const page = {
      size: { width: PAGE_W, height: PAGE_H },
      margin: { top: 1300, bottom: 1134, left: MARGIN, right: MARGIN, header: 600, footer: 560 },
    };

    const heading = (id, name, size, opts = {}) => ({
      id,
      name,
      basedOn: 'Normal',
      next: 'Normal',
      quickFormat: true,
      run: { font: FONT, size, bold: true, color: opts.color ?? INK },
      paragraph: {
        spacing: { before: opts.before ?? 240, after: opts.after ?? 100, line: 264 },
        keepNext: true,
        keepLines: true,
        outlineLevel: opts.outline,
        border: opts.border,
      },
    });

    const doc = new Document({
      creator: 'TrKimHieu',
      title: 'LEARN — Software Requirements Specification',
      description: 'SRS v1.0 cho hệ thống LEARN',
      features: { updateFields: !this.useTocField },
      styles: {
        default: {
          document: { run: { font: FONT, size: 20, color: INK }, paragraph: { spacing: { after: 110, line: 276 } } },
        },
        paragraphStyles: [
          heading('Heading1', 'Heading 1', 34, {
            outline: 0,
            before: 0,
            after: 240,
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INK, space: 6 } },
          }),
          heading('Heading2', 'Heading 2', 26, { outline: 1, before: 320, after: 120 }),
          heading('Heading3', 'Heading 3', 22, { outline: 2, before: 240, after: 80 }),
          heading('Heading4', 'Heading 4', 20, { outline: 3, before: 180, after: 60, color: INK2 }),
          {
            id: 'FrontTitle',
            name: 'Front Title',
            basedOn: 'Normal',
            next: 'Normal',
            run: { font: FONT, size: 34, bold: true },
            paragraph: {
              spacing: { after: 240 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: INK, space: 6 } },
            },
          },
          {
            id: 'FrontHeading',
            name: 'Front Heading',
            basedOn: 'Normal',
            next: 'Normal',
            run: { font: FONT, size: 24, bold: true },
            paragraph: { spacing: { before: 280, after: 100 } },
          },
          {
            id: 'Caption',
            name: 'Caption',
            basedOn: 'Normal',
            next: 'Normal',
            quickFormat: true,
            run: { font: FONT, size: 16, color: MUTED, italics: false },
            paragraph: { spacing: { before: 60, after: 80 } },
          },
          {
            id: 'TableText',
            name: 'Table Text',
            basedOn: 'Normal',
            run: { font: FONT, size: 17 },
            paragraph: { spacing: { before: 0, after: 20, line: 250 } },
          },
          {
            id: 'AfterTable',
            name: 'After Table',
            basedOn: 'Normal',
            run: { size: 8 },
            paragraph: { spacing: { before: 0, after: 120, line: 240 } },
          },
          {
            id: 'Code',
            name: 'Code Block',
            basedOn: 'Normal',
            run: { font: MONO, size: 16, color: INK },
            paragraph: {
              spacing: { before: 0, after: 0, line: 240 },
              shading: { type: ShadingType.CLEAR, fill: FILL_SOFT, color: 'auto' },
              border: { left: { style: BorderStyle.SINGLE, size: 12, color: INK2, space: 6 } },
              indent: { left: 170 },
            },
          },
          {
            id: 'Lead',
            name: 'Lead',
            basedOn: 'Normal',
            run: { size: 21, color: INK2 },
          },
          {
            id: 'Label',
            name: 'Spec Label',
            basedOn: 'Normal',
            next: 'Normal',
            run: { size: 16, bold: true, color: INK2, allCaps: true, characterSpacing: 16 },
            paragraph: { spacing: { before: 180, after: 60 }, keepNext: true },
          },
          {
            id: 'FnRule',
            name: 'Function Rule',
            basedOn: 'Normal',
            run: { size: 4 },
            paragraph: {
              spacing: { before: 280, after: 0, line: 120 },
              border: { top: { style: BorderStyle.SINGLE, size: 8, color: INK, space: 1 } },
              keepNext: true,
            },
          },
          {
            id: 'DdDesc',
            name: 'Dictionary Description',
            basedOn: 'Normal',
            run: { size: 18, color: INK2 },
            paragraph: { spacing: { after: 60 }, keepNext: true },
          },
          {
            id: 'DdConstraints',
            name: 'Dictionary Constraints',
            basedOn: 'Normal',
            run: { size: 16, color: MUTED },
            paragraph: { spacing: { before: 0, after: 160 } },
          },
          {
            id: 'FnMeta',
            name: 'Function Meta',
            basedOn: 'Normal',
            run: { size: 16, color: MUTED },
            paragraph: { spacing: { before: 0, after: 80 }, keepNext: true },
          },
          {
            id: 'Small',
            name: 'Small',
            basedOn: 'Normal',
            run: { size: 16, color: MUTED },
          },
        ],
      },
      numbering: {
        config: [
          {
            reference: 'bullets',
            levels: [0, 1, 2].map((level) => ({
              level,
              format: LevelFormat.BULLET,
              text: ['•', '–', '·'][level],
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360 + level * 340, hanging: 260 } } },
            })),
          },
          {
            reference: 'ordered',
            levels: [0, 1].map((level) => ({
              level,
              format: level === 0 ? LevelFormat.DECIMAL : LevelFormat.LOWER_LETTER,
              text: level === 0 ? '%1.' : '%2)',
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 400 + level * 340, hanging: 300 } } },
            })),
          },
        ],
      },
      sections: [
        {
          properties: { page: { ...page, margin: { ...page.margin, left: 1600 } } },
          children: this.cover(cover),
        },
        ...this.splitSections(this.blocks(rest)).map((sec) => ({
          properties: sec.landscape
            ? { page: { ...page, size: { width: PAGE_W, height: PAGE_H, orientation: PageOrientation.LANDSCAPE } } }
            : { page },
          headers: { default: new Header({ children: [headerPara()] }) },
          footers: { default: new Footer({ children: [footerPara()] }) },
          children: sec.children,
        })),
      ],
    });
    return Packer.toBuffer(doc);
  }
}

export { plain };
