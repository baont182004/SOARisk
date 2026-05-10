import { PageIntro } from '../../../components/page-intro';
import { RecommendationDetail } from '../../../components/recommendation-detail';

export default async function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Recommendation ${id}`}
        role="Recommendation Detail"
        description="Ranked candidates, score breakdown and workflow actions."
      />
      <RecommendationDetail recommendationId={id} />
    </>
  );
}
