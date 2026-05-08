import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { ReportsTable } from '../../components/reports-table';

export default function ReportsPage() {
  return (
    <>
      <PageIntro
        title="Báo cáo (Report)"
        role="Tổng hợp kết quả xử lý"
        description="Danh sách báo cáo incident được sinh sau khi workflow mô phỏng hoàn thành, bị từ chối hoặc bị hủy."
      />
      <ReportsTable />
      <FutureNote note="Báo cáo tổng hợp alert, cảnh báo chuẩn hóa, playbook, giải thích, log workflow, quyết định phê duyệt và trạng thái incident cuối." />
    </>
  );
}
