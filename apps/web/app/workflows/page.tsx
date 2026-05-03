import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function WorkflowsPage() {
  return (
    <>
      <PageIntro
        title="Workflows"
        role="Orchestration"
        description="This section represents workflow execution state after analyst approval. In this initialization phase, execution remains mock-only and no real response action is performed."
      />
      <PlaceholderTable
        title="Workflow Executions"
        columns={['Execution ID', 'Incident ID', 'Playbook ID', 'Status', 'Current Step']}
      />
      <EmptyState message="No workflow execution cards are populated yet. Future phases will surface step status and execution logs." />
      <FutureNote note="Any future containment, blocking, or isolation action should stay behind explicit analyst approval gates." />
    </>
  );
}
