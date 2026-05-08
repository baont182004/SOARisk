import { DemoWizard } from '../../components/demo-wizard';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function DemoPage() {
  return (
    <>
      <PageIntro
        title="Chạy demo SOAR"
        role="Luồng demo một nút"
        description="Chọn kịch bản và chạy toàn bộ pipeline SOAR: tạo cảnh báo demo, chuẩn hóa, gợi ý playbook, giải thích, workflow, phê duyệt, incident, báo cáo và cập nhật dashboard."
      />
      <DemoWizard />
      <FutureNote note="Wizard dùng cảnh báo tổng hợp và hành động phản hồi mô phỏng. Mục tiêu là trình diễn điều phối SOAR, không phải phát hiện gói tin IDS hay cô lập tự động thật." />
    </>
  );
}
