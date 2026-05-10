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
        description="Execution steps, logs and approval state."
      />
      <WorkflowDetail executionId={id} />
    </>
  );
}
