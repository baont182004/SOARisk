type DetailCardProps = {
  title: string;
  items: Array<{ label: string; value: string }>;
};

export function DetailCard({ title, items }: DetailCardProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl bg-[var(--panel-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </p>
            <p className="mt-2 text-sm text-slate-700">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
