import { FutureNote } from '../../components/future-note';
import { NormalizedAlertsTable } from '../../components/normalized-alerts-table';
import { PageIntro } from '../../components/page-intro';

export default function NormalizedAlertsPage() {
  return (
    <>
      <PageIntro
        title="Cảnh báo chuẩn hóa"
        role="Dữ liệu sẵn sàng cho SOAR"
        description="Danh sách bản ghi cảnh báo thống nhất sau chuẩn hóa. Dữ liệu này được dùng để gợi ý Top-3 playbook và tạo giải thích điểm số."
      />
      <NormalizedAlertsTable />
      <FutureNote note="Chuẩn hóa giúp các nguồn cảnh báo khác nhau đi vào cùng một pipeline khuyến nghị, workflow và báo cáo." />
    </>
  );
}
