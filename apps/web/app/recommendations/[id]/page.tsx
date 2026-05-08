import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { RecommendationDetail } from '../../../components/recommendation-detail';

export default async function RecommendationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Khuyến nghị ${id}`}
        role="Chi tiết khuyến nghị"
        description="Hiển thị playbook ứng viên đã xếp hạng, phân rã điểm, lý do khớp, trường còn thiếu, lựa chọn thủ công và tạo giải thích."
      />
      <RecommendationDetail recommendationId={id} />
      <FutureNote note="Chọn playbook hoặc tạo giải thích chỉ cập nhật trạng thái khuyến nghị và giải thích, trước khi workflow được khởi chạy." />
    </>
  );
}
