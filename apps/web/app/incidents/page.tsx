import { FutureNote } from '../../components/future-note';
import { IncidentsTable } from '../../components/incidents-table';
import { PageIntro } from '../../components/page-intro';

export default function IncidentsPage() {
  return (
    <>
      <PageIntro
        title="Sự cố (Incident)"
        role="Theo dõi xử lý"
        description="Theo dõi trạng thái incident được tạo từ khuyến nghị đã chọn và cập nhật theo tiến trình workflow mô phỏng."
      />
      <IncidentsTable />
      <FutureNote note="Incident tracking trong MVP tập trung vào ngữ cảnh alert, playbook đã chọn, trạng thái workflow và timeline xử lý." />
    </>
  );
}
