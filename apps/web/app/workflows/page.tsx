import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { WorkflowsTable } from '../../components/workflows-table';

export default function WorkflowsPage() {
  return (
    <>
      <PageIntro
        title="Quy trình xử lý (Workflow)"
        role="Điều phối phản hồi"
        description="Hiển thị workflow mô phỏng được tạo từ khuyến nghị đã chọn. Bước an toàn chạy tự động, bước nhạy cảm tạm dừng để analyst phê duyệt."
      />
      <WorkflowsTable />
      <FutureNote note="Workflow chỉ thực thi hành động phản hồi mô phỏng. Không có thao tác containment thật trên hạ tầng bên ngoài." />
    </>
  );
}
