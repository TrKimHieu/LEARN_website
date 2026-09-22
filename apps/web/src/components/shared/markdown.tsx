import { marked, Renderer } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

const slugify = (text: string, seen: Map<string, number>): string => {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base || 'muc' : `${base}-${count}`;
};

const ALLOWED_TAGS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'code',
  'pre',
  'blockquote',
  'a',
  'br',
  'hr',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
];

/** Render Markdown → HTML an toàn + trích mục lục từ heading — HANDBOOK §12.1 (mục lục bài dài). */
export function renderMarkdown(content: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const seen = new Map<string, number>();
  const renderer = new Renderer();
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((t) => ('text' in t ? t.text : '')).join('');
    const id = slugify(text, seen);
    if (depth <= 3) toc.push({ id, text, depth });
    return `<h${depth} id="${id}">${renderer.parser.parseInline(tokens)}</h${depth}>\n`;
  };
  const rawHtml = marked.parse(content, { async: false, gfm: true, renderer });
  const safeHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ['href', 'id'],
  });
  return { html: safeHtml, toc };
}

/** HANDBOOK §12.1: trang đọc bài render Markdown đã sanitize. Sanitize lại phía client làm lớp
 * phòng thủ thứ hai — nội dung sửa tay qua PATCH /lessons/:id không đi qua sanitize của worker. */
export function Markdown({ content }: { content: string }) {
  const { html } = renderMarkdown(content);
  return (
    <div
      className="lesson-content text-sm leading-relaxed text-ink-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
