/** Tiêu đề của một màn xác thực — h1 duy nhất của trang. */
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[2.25rem] font-semibold leading-[1.1] text-fg">{title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-subtle">{description}</p>
    </div>
  );
}
