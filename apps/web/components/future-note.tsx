type FutureNoteProps = {
  note: string;
};

export function FutureNote({ note }: FutureNoteProps) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <h3 className="text-base font-semibold text-amber-900">Ghi chu pham vi demo</h3>
      <p className="mt-2 text-sm leading-6 text-amber-800">{note}</p>
    </section>
  );
}
