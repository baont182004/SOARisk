import { ApprovalDetail } from '../../../components/approval-detail';
import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Phê duyệt ${id}`}
        role="Chi tiết phê duyệt"
        description="Ghi nhận quyết định của analyst cho bước workflow đang chờ và thể hiện rõ quyết định chỉ ảnh hưởng tới trạng thái workflow demo."
      />
      <ApprovalDetail approvalId={id} />
      <FutureNote note="Phê duyệt hoặc từ chối chỉ cập nhật trạng thái workflow lưu trong hệ thống. Không có hành động thật trên firewall, host hoặc tài khoản." />
    </>
  );
}
