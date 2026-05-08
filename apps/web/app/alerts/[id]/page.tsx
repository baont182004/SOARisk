import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { RawAlertDetail } from '../../../components/raw-alert-detail';

export default async function AlertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Cảnh báo ${id}`}
        role="Chi tiết alert"
        description="Hiển thị bản ghi cảnh báo thô, payload gốc và hai cách chuẩn hóa dùng trong đồ án: đồng bộ trực tiếp hoặc bất đồng bộ qua worker."
      />
      <RawAlertDetail alertId={id} />
      <FutureNote note="Màn hình này phục vụ truy vết alert đầu vào và không thay thế chức năng SIEM." />
    </>
  );
}
