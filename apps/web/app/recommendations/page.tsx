import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { RecommendationsTable } from '../../components/recommendations-table';

export default function RecommendationsPage() {
  return (
    <>
      <PageIntro
        title="Khuyến nghị playbook"
        role="Ghép cảnh báo với playbook"
        description="Hiển thị khuyến nghị playbook Top-3 được xếp hạng từ cảnh báo chuẩn hóa và metadata playbook có cấu trúc."
      />
      <RecommendationsTable />
      <FutureNote note="Điểm khuyến nghị được tính theo logic xác định để dễ kiểm chứng trong demo và báo cáo." />
    </>
  );
}
