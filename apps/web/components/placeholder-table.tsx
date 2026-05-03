type PlaceholderTableProps = {
  title: string;
  columns: string[];
};

export function PlaceholderTable({ title, columns }: PlaceholderTableProps) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
          Placeholder
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
        <div className="grid bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map((column) => (
              <div
                key={column}
                className="border-r border-[var(--border)] px-4 py-3 last:border-r-0"
              >
                {column}
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 py-10 text-sm text-slate-500">
          No records are rendered yet. This table will bind to API data in later phases.
        </div>
      </div>
    </section>
  );
}
