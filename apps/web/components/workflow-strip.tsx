import { SOAR_WORKFLOW_STEPS } from '@soc-soar/shared';

export function WorkflowStrip() {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Luồng SOAR mục tiêu</h3>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {SOAR_WORKFLOW_STEPS.map((step, index) => (
          <div key={step} className="flex items-center gap-3">
            <div className="rounded-xl bg-[var(--panel-muted)] px-4 py-3 text-sm font-medium text-slate-700">
              {step}
            </div>
            {index < SOAR_WORKFLOW_STEPS.length - 1 ? (
              <span className="text-teal-700">→</span>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
