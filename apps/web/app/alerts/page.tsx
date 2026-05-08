import { AlertType } from '@soc-soar/shared';

import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { RawAlertsTable } from '../../components/raw-alerts-table';

export default function AlertsPage() {
  return (
    <>
      <PageIntro
        title="Cảnh báo (Alert)"
        role="Tiếp nhận cảnh báo"
        description={`Danh sách cảnh báo thô từ nguồn upstream trước khi chuẩn hóa. Trọng tâm là xử lý SOAR theo cảnh báo, không phải tương quan SIEM. Ví dụ loại hỗ trợ: ${AlertType.PORT_SCAN}.`}
      />
      <RawAlertsTable />
      <FutureNote note="Cảnh báo thô giữ vai trò đầu vào và truy vết bằng chứng; bước chuẩn hóa sẽ tạo bản ghi sẵn sàng cho SOAR." />
    </>
  );
}
