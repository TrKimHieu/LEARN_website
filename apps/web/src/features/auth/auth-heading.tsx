/** Tiêu đề của một màn xác thực — h1 duy nhất của trang. */
export function AuthHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[2rem] font-semibold leading-tight tracking-[-0.025em] text-fg">
        {title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-subtle">{description}</p>
    </div>
  );
}
