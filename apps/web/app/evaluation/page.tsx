import { EvaluationSummaryPanel } from '../../components/evaluation-summary';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function EvaluationPage() {
  return (
    <>
      <PageIntro
        title="Đánh giá"
        role="Chỉ số phục vụ báo cáo"
        description="Tổng hợp độ chính xác khuyến nghị, tỷ lệ hoàn thành workflow, mức giảm thao tác thủ công, phân bố incident, phân bố alert và tần suất dùng playbook."
      />
      <EvaluationSummaryPanel />
      <FutureNote note="Các chỉ số đang dùng tập ground-truth demo có kiểm soát. Có thể thay bằng dataset gán nhãn lớn hơn mà không đổi kiến trúc SOAR." />
    </>
  );
}
