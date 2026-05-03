type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-[var(--border)] bg-white/70 p-6">
      <h3 className="text-base font-semibold">Empty State</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}
