type EmptyStateProps = {
  message: string;
};

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--panel)] p-6">
      <h3 className="text-base font-semibold">Chua co du lieu</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
    </section>
  );
}
