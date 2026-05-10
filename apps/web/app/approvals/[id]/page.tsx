import { ApprovalDetail } from '../../../components/approval-detail';
import { PageIntro } from '../../../components/page-intro';

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Approval ${id}`}
        role="Approval Detail"
        description="Analyst decision for a gated workflow step."
      />
      <ApprovalDetail approvalId={id} />
    </>
  );
}
