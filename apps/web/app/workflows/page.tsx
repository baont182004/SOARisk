import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { WorkflowsTable } from '../../components/workflows-table';

export default function WorkflowsPage() {
  return (
    <>
      <PageIntro
        title="Workflows"
        role="Orchestration"
        description="This section shows mock-only workflow executions created from selected recommendations. Safe steps run automatically, while sensitive containment requests pause for analyst approval."
      />
      <WorkflowsTable />
      <FutureNote note="Workflow execution in Phase 8A is mock-only. Sensitive steps pause for approval, and no real containment or response action is executed." />
    </>
  );
}
