import { PageIntro } from '../../components/page-intro';
import { WorkflowsTable } from '../../components/workflows-table';

export default function WorkflowsPage() {
  return (
    <>
      <PageIntro title="Workflow Execution" role="Response Orchestration" description="Workflow runs created from approved response playbooks." />
      <WorkflowsTable />
    </>
  );
}
