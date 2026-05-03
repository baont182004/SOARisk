type PageIntroProps = {
  title: string;
  role: string;
  description: string;
};

export function PageIntro({ title, role, description }: PageIntroProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">{role}</p>
      <h2 className="mt-3 text-3xl font-semibold">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </section>
  );
}
