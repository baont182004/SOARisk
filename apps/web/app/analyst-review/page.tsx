import { PageIntro } from '../../components/page-intro';
import { RecommendationsTable } from '../../components/recommendations-table';

export default function AnalystReviewPage() {
  return (
    <>
      <PageIntro
        title="Analyst Review"
        role="Review Gate"
        description="Review recommendations produced by PCAP intake or normalized alerts before moving them to Analyst Approval."
      />
      <RecommendationsTable />
    </>
  );
}
