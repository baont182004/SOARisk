import { ApprovalDetail } from '../../../components/approval-detail';
import { FutureNote } from '../../../components/future-note';
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
        description="This page records the analyst decision for a pending workflow step and makes it explicit that approval affects mock workflow state only."
      />
      <ApprovalDetail approvalId={id} />
      <FutureNote note="Approval or rejection updates the stored workflow state only. No real firewall, isolation, account, or host action is executed." />
    </>
  );
}
