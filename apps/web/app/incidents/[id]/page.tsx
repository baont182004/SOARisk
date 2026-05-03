import { DetailCard } from '../../../components/detail-card';
import { EmptyState } from '../../../components/empty-state';
import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Incident ${id}`}
        role="Incident Detail"
        description="This page will later combine alert context, selected playbook, approval history, workflow execution state, and final reporting artifacts."
      />
      <DetailCard
        title="Planned Detail Sections"
        items={[
          { label: 'Incident ID', value: id },
          { label: 'Timeline', value: 'State transitions and analyst comments.' },
          { label: 'Recommendation Link', value: 'Chosen playbook and score explanation.' },
          { label: 'Execution Link', value: 'Workflow status, current step, and audit log.' },
        ]}
      />
      <EmptyState message="Incident detail rendering is not implemented yet. This layout is ready for API data wiring in future tasks." />
      <FutureNote note="This route should become the operational center for analyst review, approval, and final disposition." />
    </>
  );
}
