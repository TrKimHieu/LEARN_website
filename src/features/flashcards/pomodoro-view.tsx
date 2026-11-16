'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Field, Input, PageHeader } from '@/components/ui';
import { usePageTitle } from '@/lib/use-page-title';
import {
  advance,
  formatClock,
  initialState,
  normalizeSettings,
  parseTimer,
  pause,
  remaining,
  start,
  type Phase,
  type PomodoroSettings,
  type TimerState,
} from './pomodoro';

const KEY = 'learn.pomodoro';

interface Stored {
  settings: PomodoroSettings;
  timer: TimerState;
}

function load(): Stored {
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as {
      settings?: unknown;
      timer?: unknown;
    } | null;
    const settings = normalizeSettings(raw?.settings);
    const timer = parseTimer(raw?.timer ? JSON.stringify(raw.timer) : null);
    return { settings, timer: timer ?? initialState(settings) };
  } catch {
    const settings = normalizeSettings(undefined);
    return { settings, timer: initialState(settings) };
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
    new Notification(finished === 'focus' ? 'Hết giờ học' : 'Hết giờ nghỉ', { tag: 'learn-pomodoro' });
  } catch {
    /* Android Chrome chỉ cho thông báo qua service worker */
  }
}

const PHASE_LABEL: Record<Phase, string> = { focus: 'Học', break: 'Nghỉ' };

/** Bộ đếm Pomodoro phía trình duyệt. Tính giờ theo mốc thật nên chuyển tab hay tải lại vẫn đúng. */
export function PomodoroView() {
  usePageTitle('Pomodoro');
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
        update({ ...stored, timer: out.state });
        setFinished(out.finished);
        notify(out.finished);
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [stored]);

  if (!stored) return null;
  const { settings, timer } = stored;
  const left = remaining(timer, now);

  function setMinutes(field: keyof PomodoroSettings, value: string) {
    const nextSettings = normalizeSettings({ ...settings, [field]: value });
    // Đổi độ dài chỉ áp vào giai đoạn chưa chạy, để không cắt ngang phiên đang dở.
    update({ settings: nextSettings, timer: initialState(nextSettings, timer.phase) });
  }

  return (
    <>
      <PageHeader title="Pomodoro" />
      <Card className="mx-auto flex max-w-md flex-col items-center gap-5 text-center">
        <p className="text-sm font-semibold text-fg-muted">{PHASE_LABEL[timer.phase]}</p>
        <p className="font-display text-6xl font-bold tabular-nums" aria-live="off">
          {formatClock(left)}
        </p>
        {finished && (
          <p role="status" className="text-sm font-medium">
            {finished === 'focus' ? 'Hết giờ học, nghỉ một chút.' : 'Hết giờ nghỉ, học tiếp nhé.'}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          {timer.running ? (
            <Button className="h-11" onClick={() => update({ ...stored, timer: pause(timer, Date.now()) })}>
              Tạm dừng
            </Button>
          ) : (
            <Button
              className="h-11"
              onClick={() => {
                setFinished(null);
                setNow(Date.now());
                update({ ...stored, timer: start(timer, Date.now()) });
              }}
            >
              Bắt đầu
            </Button>
          )}
          <Button
            variant="secondary"
            className="h-11"
            onClick={() => {
              setFinished(null);
              update({ ...stored, timer: initialState(settings) });
            }}
          >
            Đặt lại
          </Button>
        </div>
      </Card>

      <Card className="mx-auto mt-4 grid max-w-md grid-cols-2 gap-4">
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
    </>
  );
}
