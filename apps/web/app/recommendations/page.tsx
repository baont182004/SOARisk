import { PageIntro } from '../../components/page-intro';
import { RecommendationsTable } from '../../components/recommendations-table';

export default function RecommendationsPage() {
  return (
    <>
      <PageIntro title="Playbook Recommendation" role="Decision Support" description="Ranked response playbooks for normalized alerts." />
      <RecommendationsTable />
    </>
  );
}
