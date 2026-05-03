import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function ReportsPage() {
  return (
    <>
      <PageIntro
        title="Reports"
        role="Outcome Summaries"
        description="This page will host generated incident summaries after workflow completion. It is intended for analyst review, export, and future audit use."
      />
      <PlaceholderTable
        title="Generated Reports"
        columns={['Report ID', 'Incident ID', 'Final Status', 'Created At']}
      />
      <EmptyState message="Report rendering is not connected yet. Future implementation will populate narrative summaries and execution outcomes." />
      <FutureNote note="Report generation should eventually summarize alert context, playbook selection, approval history, workflow execution, and incident closure." />
    </>
  );
}
