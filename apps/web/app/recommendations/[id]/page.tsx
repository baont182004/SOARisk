import { FutureNote } from '../../../components/future-note';
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
        description="This page shows ranked playbook candidates, score breakdowns, matched reasons, missing fields, manual playbook selection, and explanation generation without starting workflow execution."
      />
      <RecommendationDetail recommendationId={id} />
      <FutureNote note="Selecting a playbook or generating an explanation updates recommendation and explanation state only. It does not create incidents or start workflows yet." />
    </>
  );
}
