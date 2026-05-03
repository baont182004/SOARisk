import { SOAR_FOCUS_AREAS, SOAR_SCOPE_GUARDRAILS } from '@soc-soar/shared';

import { FutureNote } from '../components/future-note';
import { PageIntro } from '../components/page-intro';
import { WorkflowStrip } from '../components/workflow-strip';

export default function HomePage() {
  return (
    <>
      <PageIntro
        title="SOC SOAR Platform Foundation"
        role="Project Orientation"
        description="This monorepo initializes a SOAR-based SOC automation platform. It starts after alerts exist, then prepares the system for normalization, recommendation, approval, workflow orchestration, incident tracking, and reporting."
      />
      <WorkflowStrip />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOAR_FOCUS_AREAS.map((area) => (
          <article
            key={area}
            className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Thesis Focus
            </p>
            <h3 className="mt-2 text-lg font-semibold">{area}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Placeholder foundation created. Feature-specific behavior will be added module by
              module in future tasks.
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {SOAR_SCOPE_GUARDRAILS.map((guardrail) => (
          <article
            key={guardrail.title}
            className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Scope Guardrail
            </p>
            <h3 className="mt-2 text-lg font-semibold">{guardrail.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{guardrail.description}</p>
          </article>
        ))}
      </section>
      <FutureNote note="This frontend intentionally avoids SIEM or IDS dashboards. PCAP appears only in a demo/testing section for generating sample alerts later." />
    </>
  );
}
