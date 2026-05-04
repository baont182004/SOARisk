import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { RecommendationsTable } from '../../components/recommendations-table';

export default function RecommendationsPage() {
  return (
    <>
      <PageIntro
        title="Recommendations"
        role="Playbook Matching"
        description="This area presents deterministic playbook recommendations ranked from normalized alerts and structured playbook metadata."
      />
      <RecommendationsTable />
      <FutureNote note="Recommendation scoring and explanation generation are deterministic in Phases 6A and 7A. Analyst approval and workflow execution remain later phases." />
    </>
  );
}
