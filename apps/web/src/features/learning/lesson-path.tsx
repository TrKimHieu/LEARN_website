'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import type { LessonSummary } from '@learn/contracts';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/components/ui/cn';
import { staggerContainer } from '@/lib/motion';

/**
 * Lộ trình bài học vẽ trên một **đồ thị hình sin**, mỗi bài học là một điểm trên đồ thị.
 *
 * Bản trước lệch node sang ngang bằng `translateX` nhưng đoạn nối lại là một thanh **dọc**
 * (`h-8 w-1`) nằm trong luồng bố cục. Thanh đó không hề đi từ tâm node này tới tâm node kia —
 * nó chỉ rơi thẳng xuống dưới node phía trên — nên lộ trình nhìn ra các mẩu gãy khúc rời rạc
 * chứ không phải một con đường. Nay đường đi là một spline SVG **đi xuyên qua đúng tâm mọi
 * node**, còn node được đặt tuyệt đối lên trên nó.
 *
 * Thứ tự node bám đúng `orderIndex` do API trả về; nút ▲▼ giữ nguyên chức năng sắp xếp lại của
 * user story C-02. Trạng thái node luôn được thể hiện bằng icon + nhãn chữ, không chỉ bằng màu.
 *
 * Đoạn nối **mang thông tin**, không phải trang trí: nét liền sky khi bài phía trên đã xong,
 * nét đứt xám khi chưa — nhìn lướt là thấy mình đã đi tới đâu, và phân biệt được cả khi không
 * trông vào màu. Vì tiến độ có thể đứt quãng (xong bài 1, bỏ bài 2, xong bài 3) nên mỗi đoạn là
 * một `<path>` riêng, không phải một đường liền bị cắt bằng `stroke-dasharray`.
 */

// ─── Hình học: một đồ thị hình sin thật ────────────────────────────────
//
// `x` tính theo **phần trăm** bề ngang khung, `y` theo **px**. Nhờ vậy biên độ sóng tự co lại
// trên màn hẹp mà không cần đo đạc bằng JS.

/**
 * Số bài học cho **một chu kỳ đầy đủ** của sóng.
 *
 * Đây là con số quyết định độ dốc, và là chỗ đã sai hai lần trước:
 *
 * - Ban đầu 4 (`sin(iπ/2)`) — node xen kẽ giữa trục và đỉnh.
 * - Rồi 2 (`cos(iπ)`) — mọi node đúng ở ±1. Nhưng xếp như vậy là **dốc nhất có thể**: cả biên
 *   độ ngang phải đi hết trong đúng một bước dọc, nên độ dốc cực đại lên tới ~52° so với phương
 *   thẳng đứng. Hàm vẫn là sin, nhưng vẽ ra thì mắt đọc thành đường gấp khúc.
 * - Nay **8**, theo đúng cách Duolingo làm. Đo trên ảnh tham chiếu: node của họ nằm ở
 *   x ≈ 850, 906, 937, 906, 850, 794 quanh tâm 850 — tức các mốc `sin` tại 0, ±0.707, ±1, đúng
 *   8 mốc một chu kỳ. Bước ngang giữa hai node kề nhau chỉ còn ~0.707 biên độ thay vì 2 lần
 *   biên độ, nên đường thoải hẳn.
 *
 * Node thứ 2 và thứ 6 của mỗi chu kỳ vẫn rơi đúng đỉnh/đáy ±1.
 */
const NODES_PER_PERIOD = 8;

/** Biên độ sóng, tính theo % bề ngang khung. */
const AMPLITUDE = 22;
/** Khoảng cách dọc giữa hai node liên tiếp (px). */
const ROW_HEIGHT = 118;
/** Chừa trên/dưới cho vòng nhấn của node đang học. */
const PAD_TOP = 52;
const PAD_BOTTOM = 52;

/** Pha của sóng tại vị trí bài học `u`. */
const phase = (u: number): number => (u * 2 * Math.PI) / NODES_PER_PERIOD;

/** Đồ thị `x = 50 + A·sin(2πu / 8)`. */
const pathX = (u: number): number => 50 + AMPLITUDE * Math.sin(phase(u));
const pathY = (u: number): number => PAD_TOP + u * ROW_HEIGHT;

const nodeX = (i: number): number => pathX(i);
const nodeY = (i: number): number => pathY(i);

/**
 * Số điểm lấy mẫu giữa hai node. Vẽ sin bằng cách **lấy mẫu chính hàm số** thay vì xấp xỉ bằng
 * Bézier: đường ra đúng là hình sin, không phải một đường giông giống. 16 đoạn trên 118px là
 * dưới 8px một đoạn — cộng `stroke-linejoin="round"` thì mắt không phân biệt được với đường
 * cong liên tục.
 */
const SAMPLES = 16;

/** Đoạn sóng nối bài `i` với bài `i + 1`. */
function sineSegment(i: number): string {
  let d = '';
  for (let s = 0; s <= SAMPLES; s++) {
    const u = i + s / SAMPLES;
    d += `${s === 0 ? 'M' : 'L'} ${pathX(u).toFixed(3)} ${pathY(u).toFixed(2)} `;
  }
  return d.trim();
}

/**
 * Nhãn nằm **bên cạnh** node, không nằm dưới — đặt dưới thì đường cong đi xuyên qua chữ.
 *
 * Node lệch phải → nhãn sang trái, và ngược lại. Với node rơi **đúng trên trục** (chu kỳ 8 có
 * hai node như vậy mỗi vòng), lệch bằng 0 nên phải xét hướng đi: đặt nhãn về phía đường **không**
 * hướng tới, tức ngược dấu đạo hàm.
 */
const labelSide = (i: number): 'left' | 'right' => {
  const offset = Math.sin(phase(i));
  if (Math.abs(offset) > 0.01) return offset > 0 ? 'left' : 'right';
  return Math.cos(phase(i)) > 0 ? 'left' : 'right';
};

/** Bán kính node (32px) cộng khoảng thở. */
const LABEL_GAP_PX = 48;

type NodeState = 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';

// Màu giữ nguyên `[SPEC]` §14.2. Nền sky đi với icon navy-900 (9.86:1); chữ/icon trắng trên
// sky chỉ 1.90:1 nên không có biến thể đó — xem docs/UI-GUIDE.md §2.
const NODE_STYLE: Record<NodeState, string> = {
  COMPLETED: 'bg-sky-500 text-navy-900 ring-sky-600 hover:bg-sky-400',
  IN_PROGRESS: 'bg-white text-sky-700 ring-sky-500 hover:bg-sky-50',
  NOT_STARTED: 'bg-surface-200 text-ink-500 ring-surface-400 hover:bg-surface-300',
};

const STATE_LABEL: Record<NodeState, string> = {
  COMPLETED: 'Đã hoàn thành',
  IN_PROGRESS: 'Đang học',
  NOT_STARTED: 'Chưa bắt đầu',
};

/** Node hiện ra lần lượt từ trên xuống, đúng thứ tự người học sẽ đi. */
const NODE_VARIANTS = {
  hidden: { opacity: 0, y: 14, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 320, damping: 26 },
  },
};

/**
 * Đồ thị sin phía sau các node.
 *
 * Hai kênh tín hiệu, không phải một:
 *
 * - **Nét liền + `sky-500`** — đoạn đã đi qua (bài phía trên đã hoàn thành).
 * - **Nét đứt + `surface-400`** — đoạn chưa đi.
 *
 * Kiểu nét mới là điểm đáng nói. Bản trước phân biệt hai trạng thái **chỉ bằng màu**, đúng thứ
 * `docs/UI-GUIDE.md` §2 cấm ("màu không bao giờ là tín hiệu duy nhất"). Nét đứt là kênh thứ hai,
 * đọc được cả khi in đen trắng hoặc với người loạn sắc. Nó cũng đúng nghĩa thông thường của nét
 * đứt: phần chưa thành hình, chưa đi tới.
 *
 * Nét mảnh (2.5px thay vì 10px) vì đây là **đồ thị**, không phải con đường: đường dày biến biểu
 * đồ thành một dải băng và át mất node, vốn mới là thứ người dùng bấm vào.
 *
 * `aria-hidden`: tiến độ đã có ở icon và nhãn chữ của từng node, đọc lại là thừa.
 */
function PathTrack({ count, travelled }: { count: number; travelled: boolean[] }) {
  const height = PAD_TOP + (count - 1) * ROW_HEIGHT + PAD_BOTTOM;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 100 ${height}`}
      // `none`: trục x co giãn theo bề ngang khung (đơn vị %), trục y giữ nguyên px. Nét vẽ
      // sẽ bị kéo méo theo, nên `vector-effect` giữ nó luôn dày đúng số px đã đặt.
      preserveAspectRatio="none"
    >
      {Array.from({ length: Math.max(count - 1, 0) }, (_, i) => (
        <path
          key={i}
          d={sineSegment(i)}
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={travelled[i] ? undefined : '1 7'}
          vectorEffect="non-scaling-stroke"
          className={travelled[i] ? 'stroke-sky-500' : 'stroke-surface-400'}
        />
      ))}
    </svg>
  );
}

function LessonNode({
  lesson,
  index,
  courseId,
  canMoveUp,
  canMoveDown,
  onMove,
  reordering,
}: {
  lesson: LessonSummary;
  index: number;
  courseId: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  reordering: boolean;
}) {
  const state = lesson.progressStatus as NodeState;
  const icon = state === 'COMPLETED' ? 'check' : state === 'IN_PROGRESS' ? 'play' : 'star';

  return (
    // Phép canh tâm (`translate(-50%, -50%)`) nằm ở `<li>` thường, KHÔNG ở phần tử `motion`:
    // motion chiếm quyền thuộc tính `transform` của chính phần tử nó điều khiển để chạy y/scale,
    // nên đặt chung một chỗ thì node bị kéo lệch khỏi đường cong ngay khi animation vào chỗ.
    <li
      className="absolute"
      style={{
        left: `${nodeX(index)}%`,
        top: nodeY(index),
        transform: 'translate(-50%, -50%)',
      }}
    >
      <motion.div variants={NODE_VARIANTS} className="group relative grid place-items-center">
        {/* Sắp xếp lại — C-02. Hiện khi hover hoặc khi bàn phím focus vào. */}
        {/* Đặt về phía ĐỐI DIỆN nhãn để không đè lên tiêu đề bài học. */}
        <div
          className={cn(
            'absolute top-1/2 flex -translate-y-1/2 flex-col gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100',
            labelSide(index) === 'left' ? '-right-9' : '-left-9',
          )}
        >
          <button
            type="button"
            onClick={() => onMove(index, -1)}
            disabled={!canMoveUp || reordering}
            aria-label={`Chuyển "${lesson.title}" lên trên`}
            className="grid size-7 place-items-center rounded-lg bg-white/80 text-ink-500 backdrop-blur hover:bg-surface-200 disabled:opacity-25"
          >
            <Icon name="chevron-down" size={16} className="rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, 1)}
            disabled={!canMoveDown || reordering}
            aria-label={`Chuyển "${lesson.title}" xuống dưới`}
            className="grid size-7 place-items-center rounded-lg bg-white/80 text-ink-500 backdrop-blur hover:bg-surface-200 disabled:opacity-25"
          >
            <Icon name="chevron-down" size={16} />
          </button>
        </div>

        {/* Vòng nhấn cho bài đang học. Dùng `motion` thay vì `animate-pulse` để
            `MotionConfig reducedMotion="user"` tắt được nó — animation thuần CSS
            của Tailwind không nghe theo công tắc đó. */}
        {state === 'IN_PROGRESS' && (
          <motion.span
            aria-hidden
            className="absolute size-16 rounded-full ring-4 ring-sky-300"
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
          <Link
            href={`/courses/${courseId}/lessons/${lesson.id}`}
            aria-label={`Bài ${index + 1}: ${lesson.title} — ${STATE_LABEL[state]}`}
            className={cn(
              'relative grid size-16 place-items-center rounded-full ring-2 shadow-raised',
              'transition-all duration-200',
              'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-600',
              NODE_STYLE[state],
            )}
          >
            <Icon name={icon} size={26} strokeWidth={3} filled={state === 'NOT_STARTED'} />
          </Link>
        </motion.div>
      </motion.div>
    </li>
  );
}

/**
 * Nhãn của một node, đặt tuyệt đối trong khung `<ol>` chứ không nằm trong node.
 *
 * Neo vào **mép khung** (`left: 0` hoặc `right: 0`) thay vì vào node, nên nhãn tự dùng hết chỗ
 * còn lại và không bao giờ tràn ra ngoài — kể cả node ở giữa trên màn 390px, nơi mỗi bên chỉ
 * còn khoảng 90px. Neo vào node với bề rộng cố định thì đúng trường hợp đó bị cắt mất chữ.
 *
 * `aria-hidden`: nội dung này đã nằm trong `aria-label` của chính node, đọc lại là thừa.
 */
function NodeLabel({ lesson, index }: { lesson: LessonSummary; index: number }) {
  const state = lesson.progressStatus as NodeState;
  const side = labelSide(index);
  const x = nodeX(index);

  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute -translate-y-1/2',
        side === 'left' ? 'text-right' : 'text-left',
      )}
      style={
        side === 'left'
          ? { left: 0, width: `calc(${x}% - ${LABEL_GAP_PX}px)`, top: nodeY(index) }
          : { left: `calc(${x}% + ${LABEL_GAP_PX}px)`, right: 0, top: nodeY(index) }
      }
    >
      <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink-900">{lesson.title}</p>
      <p className="mt-0.5 text-xs text-ink-500">
        {STATE_LABEL[state]}
        {lesson.bestScore !== null && ` · ${lesson.bestScore} điểm`}
      </p>
    </div>
  );
}

export function LessonPath({
  lessons,
  courseId,
  onMove,
  reordering,
}: {
  lessons: LessonSummary[];
  courseId: string;
  onMove: (index: number, direction: -1 | 1) => void;
  reordering: boolean;
}) {
  // Lộ trình dài thì tổng thời gian vào phải giữ dưới ~600ms, nếu không bài cuối
  // xuất hiện sau khi người dùng đã cuộn tới nơi.
  const stagger = Math.min(0.06, 0.6 / Math.max(lessons.length, 1));

  // Đoạn i nối bài i với bài i+1 → thành nét liền sky khi bài i đã xong.
  const travelled = lessons.slice(0, -1).map((l) => l.progressStatus === 'COMPLETED');
  const height = PAD_TOP + Math.max(lessons.length - 1, 0) * ROW_HEIGHT + PAD_BOTTOM;

  return (
    <motion.ol
      initial="hidden"
      animate="show"
      variants={staggerContainer(stagger)}
      // `mx-auto max-w-md`: biên độ là % nên khung càng rộng sóng càng banh ra; chặn lại để
      // trên màn lớn lộ trình vẫn đọc như một con đường chứ không phải hình sin bẹt.
      className="relative mx-auto max-w-md"
      style={{ height }}
    >
      {lessons.length > 1 && <PathTrack count={lessons.length} travelled={travelled} />}

      {lessons.map((lesson, i) => (
        <LessonNode
          key={lesson.id}
          lesson={lesson}
          index={i}
          courseId={courseId}
          canMoveUp={i > 0}
          canMoveDown={i < lessons.length - 1}
          onMove={onMove}
          reordering={reordering}
        />
      ))}

      {lessons.map((lesson, i) => (
        <NodeLabel key={`${lesson.id}-label`} lesson={lesson} index={i} />
      ))}
    </motion.ol>
  );
}
