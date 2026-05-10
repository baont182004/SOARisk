import { IncidentDetail } from '../../../components/incident-detail';
import { PageIntro } from '../../../components/page-intro';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Incident ${id}`}
        role="Incident Detail"
        description="Case timeline and linked response artifacts."
      />
      <IncidentDetail incidentId={id} />
    </>
  );
}
