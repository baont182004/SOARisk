import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { PlaybookDetail } from '../../../components/playbook-detail';

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Playbook ${id}`}
        role="Chi tiết playbook"
        description="Hiển thị metadata có cấu trúc, điều kiện khớp, hành động theo thứ tự, tài liệu tham chiếu và ràng buộc an toàn của một playbook."
      />
      <PlaybookDetail playbookId={id} />
      <FutureNote note="Hành động nhạy cảm chỉ là yêu cầu mô phỏng và cần phê duyệt rõ ràng của analyst trước khi workflow tiếp tục." />
    </>
  );
}
