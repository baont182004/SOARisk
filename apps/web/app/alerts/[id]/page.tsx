import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { RawAlertDetail } from '../../../components/raw-alert-detail';

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Alert ${id}`}
        role="Alert Detail"
        description="This page shows a raw alert record, the original payload, and both normalization paths used in the thesis: direct synchronous testing and worker-backed asynchronous processing."
      />
      <RawAlertDetail alertId={id} />
      <FutureNote note="This route should later support both analyst-friendly summaries and raw evidence traceability." />
    </>
  );
}
