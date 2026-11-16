import { ButtonLink, Card } from '@/components/ui';

/** Lối vào Pomodoro trên dashboard. */
export function FocusLink() {
  return (
    <Card className="mt-4 flex flex-wrap items-center justify-between gap-4">
      <h2 className="font-display text-lg font-semibold">Pomodoro</h2>
      <ButtonLink href="/focus" variant="secondary" className="max-md:h-11">
        Mở bộ đếm
      </ButtonLink>
    </Card>
  );
}
