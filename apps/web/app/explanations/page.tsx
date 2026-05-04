import { ExplanationsTable } from '../../components/explanations-table';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function ExplanationsPage() {
  return (
    <>
      <PageIntro
        title="Explanations"
        role="Recommendation Explanation"
        description="This page lists deterministic explanation snapshots that translate recommendation scoring into analyst-readable rationale, limitations, and approval guidance."
      />
      <ExplanationsTable />
      <FutureNote note="Explanation records are deterministic and non-operational in Phase 7A. Analyst approval and workflow execution remain later phases." />
    </>
  );
}
