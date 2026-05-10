import { PageIntro } from '../../../components/page-intro';
import { RawAlertDetail } from '../../../components/raw-alert-detail';

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Raw Alert ${id}`}
        role="Alert Detail"
        description="Source alert, evidence and normalization action."
      />
      <RawAlertDetail alertId={id} />
    </>
  );
}
