import { EmptyState } from '../../components/empty-state';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaceholderTable } from '../../components/placeholder-table';

export default function IncidentsPage() {
  return (
    <>
      <PageIntro
        title="Incidents"
        role="Analyst Tracking"
        description="This page will track incident state transitions after a recommended playbook is selected or approved. It is the analyst-facing record of SOAR activity."
      />
      <PlaceholderTable
        title="Incident Register"
        columns={['Incident ID', 'Title', 'Severity', 'Status', 'Updated At']}
      />
      <EmptyState message="Incident data has not been connected yet. The route currently reserves layout for the future incident register." />
      <FutureNote note="Later work should add timeline rendering, assignment, approval decisions, and evidence-linked status changes." />
    </>
  );
}
