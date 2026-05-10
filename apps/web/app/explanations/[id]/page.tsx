import { ExplanationDetail } from '../../../components/explanation-detail';
import { PageIntro } from '../../../components/page-intro';

export default async function ExplanationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Explanation ${id}`}
        role="Decision Rationale"
        description="Recommendation rationale, evidence and approval context."
      />
      <ExplanationDetail explanationId={id} />
    </>
  );
}
