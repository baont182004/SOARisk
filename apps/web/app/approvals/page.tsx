import { ApprovalsTable } from '../../components/approvals-table';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function ApprovalsPage() {
  return (
    <>
      <PageIntro
        title="Phê duyệt"
        role="Cổng kiểm soát analyst"
        description="Danh sách yêu cầu phê duyệt được tạo khi workflow đi tới bước phản hồi mô phỏng có rủi ro hoặc nhạy cảm."
      />
      <ApprovalsTable />
      <FutureNote note="Phê duyệt chỉ cho phép workflow demo tiếp tục. Hệ thống không gọi firewall, EDR, tài khoản hay thiết bị thật." />
    </>
  );
}
