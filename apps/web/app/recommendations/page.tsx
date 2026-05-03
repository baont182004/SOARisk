import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function RecommendationsPage() {
  return (
    <>
      <PageIntro
        title="Recommendations"
        role="Playbook Matching"
        description="This area will present ranked playbook recommendations, score breakdowns, and explanation summaries derived from normalized alerts."
      />
      <PlaceholderTable
        title="Recommendation Queue"
        columns={['Recommendation ID', 'Normalized Alert', 'Top Playbook', 'Score', 'Created At']}
      />
      <EmptyState message="Recommendation results are not rendered yet. Future tasks will connect ranking output and human-readable explanations." />
      <FutureNote note="Later phases should make recommendation confidence transparent enough for analyst approval decisions." />
    </>
  );
}
