import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PcapDemoPanel } from '../../components/pcap-demo-panel';

export default function PcapDemoPage() {
  return (
    <>
      <PageIntro
        title="PCAP demo"
        role="Nguồn tạo cảnh báo demo"
        description="Khu vực này chỉ dùng metadata PCAP có kiểm soát để tạo cảnh báo mẫu. Đây không phải màn hình phân tích packet và không phải chức năng IDS."
      />
      <PcapDemoPanel />
      <FutureNote note="PCAP chỉ phục vụ trình diễn đầu vào. Giá trị chính của hệ thống nằm ở tự động hóa SOAR sau khi cảnh báo đã tồn tại." />
    </>
  );
}
