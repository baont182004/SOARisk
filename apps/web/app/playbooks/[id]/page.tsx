import { DetailCard } from '../../../components/detail-card';
import { EmptyState } from '../../../components/empty-state';
import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Playbook ${id}`}
        role="Playbook Detail"
        description="This page will later show supported alert types, required fields, action steps, approval requirements, and future workflow graph views."
      />
      <DetailCard
        title="Planned Detail Sections"
        items={[
          { label: 'Playbook ID', value: id },
          {
            label: 'Matching Metadata',
            value: 'Alert type coverage, severity range, and asset context.',
          },
          { label: 'Actions', value: 'Mock-only response steps with future approval gates.' },
          {
            label: 'Analyst Notes',
            value: 'Reserved for future reviewer comments and validation.',
          },
        ]}
      />
      <EmptyState message="No playbook detail data is displayed yet. This route is ready for future API integration." />
      <FutureNote note="Sensitive actions should remain mock-only until explicit analyst approval controls are implemented." />
    </>
  );
}
