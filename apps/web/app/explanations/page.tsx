import { ExplanationsTable } from '../../components/explanations-table';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function ExplanationsPage() {
  return (
    <>
      <PageIntro
        title="Giải thích khuyến nghị"
        role="Explanation engine"
        description="Danh sách bản giải thích biến điểm khuyến nghị thành lý do dễ đọc cho analyst: vì sao chọn playbook, giới hạn và gợi ý phê duyệt."
      />
      <ExplanationsTable />
      <FutureNote note="Giải thích chỉ hỗ trợ quyết định, không tự phê duyệt hoặc thực thi hành động phản hồi." />
    </>
  );
}
