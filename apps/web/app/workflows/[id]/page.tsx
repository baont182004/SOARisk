import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { WorkflowDetail } from '../../../components/workflow-detail';

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Workflow ${id}`}
        role="Chi tiết workflow"
        description="Hiển thị các bước workflow, log thực thi, trạng thái phê duyệt và tiến trình mô phỏng sinh từ playbook đã chọn."
      />
      <WorkflowDetail executionId={id} />
      <FutureNote note="Phê duyệt bước workflow chỉ cho luồng mô phỏng tiếp tục. Không có chặn, cô lập hay phản hồi thật bên ngoài." />
    </>
  );
}
