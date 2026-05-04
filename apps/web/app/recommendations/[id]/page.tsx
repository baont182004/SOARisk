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
        description="This page shows ranked playbook candidates, score breakdowns, matched reasons, missing fields, and manual playbook selection without starting workflow execution."
      />
      <RecommendationDetail recommendationId={id} />
      <FutureNote note="Selecting a playbook in Phase 6A updates recommendation state only. It does not create incidents or start workflows yet." />
    </>
  );
}
