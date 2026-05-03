import { DetailCard } from '../../../components/detail-card';
import { EmptyState } from '../../../components/empty-state';
import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Alert ${id}`}
        role="Alert Detail"
        description="This page will later show normalized fields, evidence, related recommendation context, and source detector metadata for a selected alert."
      />
      <DetailCard
        title="Planned Detail Sections"
        items={[
          { label: 'Identifier', value: id },
          { label: 'Normalization', value: 'Field mapping, confidence, and evidence summary.' },
          { label: 'Asset Context', value: 'Hostname, owner, environment, and criticality.' },
          { label: 'Downstream Usage', value: 'Recommendation, approval, and workflow links.' },
        ]}
      />
      <EmptyState message="Alert detail data is not connected yet. The page currently reserves space for future API-backed rendering." />
      <FutureNote note="This route should later support both analyst-friendly summaries and raw evidence traceability." />
    </>
  );
}
