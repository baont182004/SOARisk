import { ExplanationDetail } from '../../../components/explanation-detail';
import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';

export default async function ExplanationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Giải thích ${id}`}
        role="Chi tiết giải thích"
        description="Chuyển điểm khuyến nghị thành các phần giải thích dễ đọc: lý do theo playbook, ghi chú phê duyệt và giới hạn."
      />
      <ExplanationDetail explanationId={id} />
      <FutureNote note="Nội dung giải thích chỉ hỗ trợ quyết định. Nó không thực thi, phê duyệt hay mô phỏng hành động phản hồi." />
    </>
  );
}
