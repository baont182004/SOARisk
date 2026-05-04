import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { WorkflowDetail } from '../../../components/workflow-detail';

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Workflow ${id}`}
        role="Workflow Detail"
        description="This page shows ordered workflow steps, execution logs, approval state, and mock-only workflow progress derived from the selected playbook."
      />
      <WorkflowDetail executionId={id} />
      <FutureNote note="Approving a workflow step only continues the mock workflow. No external blocking, isolation, or response action is executed." />
    </>
  );
}
