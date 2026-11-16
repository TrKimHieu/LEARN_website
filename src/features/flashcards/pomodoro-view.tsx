'use client';

import { FeedbackPrompt } from '@/features/feedback/feedback-prompt';
import { useEffect, useState } from 'react';
import { Card, Field, Icon, Input, cn } from '@/components/ui';
import { Mascot } from '@/components/shared/mascot';
import type { MascotState } from '@/components/shared/mascot';
import { usePageTitle } from '@/lib/use-page-title';
import {
  advance,
  countFocus,
  elapsedFraction,
  formatClock,
  initialState,
  normalizeSettings,
  parseTimer,
  pause,
  remaining,
  start,
  todayKey,
  type DayCount,
  type Phase,
  type PomodoroSettings,
  type TimerState,
} from './pomodoro';

const KEY = 'learn.pomodoro';
/** Một vòng Pomodoro cổ điển là 4 phiên học. */
const CYCLE = 4;

interface Stored {
  settings: PomodoroSettings;
  timer: TimerState;
  day: DayCount | null;
}

function load(): Stored {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as {
      settings?: unknown;
      timer?: unknown;
      day?: DayCount;
    } | null;
    const settings = normalizeSettings(raw?.settings);
    const timer = parseTimer(raw?.timer ? JSON.stringify(raw.timer) : null);
    const day =
      raw?.day && typeof raw.day.date === 'string' && typeof raw.day.done === 'number'
        ? raw.day
        : null;
    return { settings, timer: timer ?? initialState(settings), day };
  } catch {
    const settings = normalizeSettings(undefined);
    return { settings, timer: initialState(settings), day: null };
  }
}

function save(value: Stored) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* bị chặn lưu trữ: bộ đếm vẫn chạy, chỉ không nhớ khi tải lại */
  }
}

/** Báo hết giờ bằng thông báo trình duyệt nếu đã được cho phép; trình duyệt chặn thì bỏ qua. */
function notify(finished: Phase) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    new Notification(finished === 'focus' ? 'Hết giờ học' : 'Hết giờ nghỉ', {
      tag: 'learn-pomodoro',
    });
  } catch {
    /* Android Chrome chỉ cho thông báo qua service worker */
  }
}

const PHASE_LABEL: Record<Phase, string> = { focus: 'Học', break: 'Nghỉ' };
/** Màu theo giai đoạn: học dùng xanh dương (đang làm), nghỉ dùng xanh lá (đạt, thả lỏng). */
const PHASE_COLOR: Record<Phase, string> = { focus: 'var(--brand)', break: 'var(--ok)' };
const PHASE_SOFT: Record<Phase, string> = { focus: 'bg-brand-soft', break: 'bg-ok-soft' };

function mascotFor(timer: TimerState, finished: Phase | null): MascotState {
  if (finished === 'focus') return 'celebrate';
  if (!timer.running) return 'idle';
  return timer.phase === 'focus' ? 'working' : 'happy';
}

const endClock = (endsAt: number) =>
  new Date(endsAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

/** Bộ đếm Pomodoro phía trình duyệt. Tính giờ theo mốc thật nên chuyển tab hay tải lại vẫn đúng. */
export function PomodoroView() {
  const [stored, setStored] = useState<Stored | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finished, setFinished] = useState<Phase | null>(null);

  useEffect(() => setStored(load()), []);

  const update = (next: Stored) => {
    setStored(next);
    save(next);
  };

  useEffect(() => {
    if (!stored?.timer.running) return;
    const id = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      const out = advance(stored.timer, stored.settings, at);
      if (out.finished) {
        update({
          ...stored,
          timer: out.state,
          day: countFocus(stored.day, out.finished, todayKey(new Date(at))),
        });
        setFinished(out.finished);
        notify(out.finished);
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [stored]);

  const clock = stored ? formatClock(remaining(stored.timer, now)) : '';
  usePageTitle(
    stored?.timer.running ? `${clock} · ${PHASE_LABEL[stored.timer.phase]}` : 'Pomodoro',
  );

  if (!stored) return null;
  const { settings, timer } = stored;
  const phase = timer.phase;
  const doneToday = countFocus(stored.day, null, todayKey(new Date(now))).done;
  const filled = doneToday === 0 ? 0 : doneToday % CYCLE || CYCLE;

  function toggle() {
    const at = Date.now();
    setNow(at);
    setFinished(null);
    update({ ...stored!, timer: timer.running ? pause(timer, at) : start(timer, at) });
  }

  function choosePhase(next: Phase) {
    setFinished(null);
    update({ ...stored!, timer: initialState(settings, next) });
  }

  function setMinutes(field: keyof PomodoroSettings, value: string) {
    const nextSettings = normalizeSettings({ ...settings, [field]: value });
    // Đổi độ dài chỉ áp vào giai đoạn chưa chạy, để không cắt ngang phiên đang dở.
    update({ ...stored!, settings: nextSettings, timer: initialState(nextSettings, phase) });
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem] md:items-start">
      <h1 className="sr-only">Pomodoro</h1>
      <section
        aria-label="Bộ đếm Pomodoro"
        className={cn(
          'flex flex-col items-center gap-6 rounded-card px-5 py-8 transition-colors duration-500 md:py-10',
          PHASE_SOFT[phase],
        )}
      >
        <div
          role="radiogroup"
          aria-label="Giai đoạn"
          className="inline-flex rounded-pill bg-panel p-1 shadow-card"
        >
          {(['focus', 'break'] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={phase === p}
              disabled={timer.running}
              onClick={() => choosePhase(p)}
              className={cn(
                'h-11 min-w-24 rounded-pill px-5 text-sm font-semibold transition-colors focus-ring md:h-9',
                phase === p ? 'text-white' : 'text-fg-muted hover:text-fg',
                'disabled:cursor-not-allowed',
              )}
              style={phase === p ? { background: PHASE_COLOR[p] } : undefined}
            >
              {PHASE_LABEL[p]}
            </button>
          ))}
        </div>

        <Ring fraction={elapsedFraction(timer, settings, now)} color={PHASE_COLOR[phase]}>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
            {PHASE_LABEL[phase]}
          </span>
          <span className="font-display text-6xl font-bold leading-none tabular-nums md:text-7xl">
            {clock}
          </span>
          <span className="h-5 text-sm text-fg-muted">
            {timer.running && timer.endsAt ? `Xong lúc ${endClock(timer.endsAt)}` : ''}
          </span>
        </Ring>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setFinished(null);
              update({ ...stored, timer: initialState(settings, phase) });
            }}
            aria-label="Đặt lại"
            className="grid size-12 place-items-center rounded-full bg-panel text-fg-muted shadow-card transition-colors hover:text-fg focus-ring"
          >
            <Icon name="retry" size={20} />
          </button>
          <button
            type="button"
            onClick={toggle}
            aria-label={timer.running ? 'Tạm dừng' : 'Bắt đầu'}
            className="grid size-16 place-items-center rounded-full text-white shadow-raised transition-transform active:scale-95 focus-ring motion-reduce:transition-none"
            style={{ background: PHASE_COLOR[phase] }}
          >
            <Icon name={timer.running ? 'pause' : 'play'} size={28} />
          </button>
        </div>

        <FeedbackPrompt
          when={finished === 'focus'}
          title="Pomodoro thế nào?"
          items={[
            {
              topic: 'POMODORO',
              question: 'USEFULNESS',
              label: 'Pomodoro có giúp bạn tập trung không?',
            },
          ]}
        />
        {finished && (
          <p role="status" className="text-sm font-medium">
            {finished === 'focus' ? 'Hết giờ học, nghỉ một chút.' : 'Hết giờ nghỉ, học tiếp nhé.'}
          </p>
        )}
      </section>

      <div className="grid gap-4">
        <Card className="flex items-center gap-4">
          <Mascot state={mascotFor(timer, finished)} size={72} />
          <div className="min-w-0">
            <p className="text-sm text-fg-muted">Hôm nay</p>
            <p className="font-display text-2xl font-bold tabular-nums">{doneToday} phiên học</p>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {Array.from({ length: CYCLE }, (_, i) => (
                <span
                  key={i}
                  className="size-2.5 rounded-full"
                  style={{ background: i < filled ? PHASE_COLOR.focus : 'var(--track)' }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="grid grid-cols-2 gap-4">
          <Field label="Học (phút)" htmlFor="focus-min">
            <Input
              id="focus-min"
              type="number"
              inputMode="numeric"
              min={1}
              max={120}
              disabled={timer.running}
              value={settings.focusMin}
              onChange={(e) => setMinutes('focusMin', e.target.value)}
            />
          </Field>
          <Field label="Nghỉ (phút)" htmlFor="break-min">
            <Input
              id="break-min"
              type="number"
              inputMode="numeric"
              min={1}
              max={60}
              disabled={timer.running}
              value={settings.breakMin}
              onChange={(e) => setMinutes('breakMin', e.target.value)}
            />
          </Field>
        </Card>
      </div>
    </div>
  );
}

const R = 108;
const C = 2 * Math.PI * R;

/** Vòng tiến độ lớn: phần đã trôi tô màu giai đoạn, có chấm ở đầu nét. */
function Ring({
  fraction,
  color,
  children,
}: {
  fraction: number;
  color: string;
  children: React.ReactNode;
}) {
  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  const knob = { x: 120 + R * Math.cos(angle), y: 120 + R * Math.sin(angle) };
  return (
    <div
      role="progressbar"
      aria-label="Thời gian đã trôi"
      aria-valuenow={Math.round(fraction * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="relative grid aspect-square w-[min(76vw,300px)] place-items-center"
    >
      <svg viewBox="0 0 240 240" className="absolute inset-0 size-full" aria-hidden="true">
        <circle
          cx="120"
          cy="120"
          r={R}
          fill="var(--panel)"
          stroke="var(--track)"
          strokeWidth="12"
        />
        {/* Chưa trôi gì thì không vẽ nét, kẻo đầu tròn của nét thành một chấm lạc. */}
        {fraction > 0 && (
          <circle
            cx="120"
            cy="120"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - fraction)}
            transform="rotate(-90 120 120)"
            className="transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none"
          />
        )}
        {fraction > 0 && fraction < 1 && (
          <circle
            cx={knob.x}
            cy={knob.y}
            r="9"
            fill="var(--panel)"
            stroke={color}
            strokeWidth="5"
          />
        )}
      </svg>
      <div className="relative flex flex-col items-center gap-2">{children}</div>
    </div>
  );
}
