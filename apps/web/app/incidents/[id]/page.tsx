import { FutureNote } from '../../../components/future-note';
import { IncidentDetail } from '../../../components/incident-detail';
import { PageIntro } from '../../../components/page-intro';

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Incident ${id}`}
        role="Chi tiết incident"
        description="Tổng hợp ngữ cảnh alert, playbook đã chọn, trạng thái workflow và timeline để analyst theo dõi xử lý."
      />
      <IncidentDetail incidentId={id} />
      <FutureNote note="Chi tiết incident là màn hình tracking cho demo SOAR, không thay thế một nền tảng case management đầy đủ như TheHive." />
    </>
  );
}
