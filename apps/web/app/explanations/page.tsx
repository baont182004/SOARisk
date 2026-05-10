import { PageIntro } from '../../components/page-intro';
import { ExplanationsTable } from '../../components/explanations-table';

export default function ExplanationsPage() {
  return (
    <>
      <PageIntro title="Recommendation Explanation" role="Decision Rationale" description="Concise rationale, risk and approval context for recommendations." />
      <ExplanationsTable />
    </>
  );
}
