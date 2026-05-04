import { ExplanationDetail } from '../../../components/explanation-detail';
import { FutureNote } from '../../../components/future-note';
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
        role="Explanation Detail"
        description="This page converts recommendation scoring into analyst-readable explanation sections, playbook-level rationale, approval notes, and explicit limitations."
      />
      <ExplanationDetail explanationId={id} />
      <FutureNote note="Explanation text is deterministic and decision-support only. It does not execute, approve, or simulate operational response actions." />
    </>
  );
}
