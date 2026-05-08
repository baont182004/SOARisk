import { SOAR_FOCUS_AREAS, SOAR_SCOPE_GUARDRAILS } from '@soc-soar/shared';

import { DashboardSummaryPanel } from '../components/dashboard-summary';
import { FutureNote } from '../components/future-note';
import { PageIntro } from '../components/page-intro';
import { WorkflowStrip } from '../components/workflow-strip';

export default function HomePage() {
  return (
    <>
      <PageIntro
        title="SOARisk - Nền tảng tự động hóa SOC"
        role="Tổng quan dự án"
        description="Hệ thống tập trung vào phần SOAR sau khi cảnh báo đã tồn tại: chuẩn hóa cảnh báo, gợi ý playbook, giải thích, phê duyệt, điều phối workflow, theo dõi sự cố và sinh báo cáo."
      />
      <WorkflowStrip />
      <DashboardSummaryPanel />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {SOAR_FOCUS_AREAS.map((area) => (
          <article
            key={area}
            className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              Trọng tâm đồ án
            </p>
            <h3 className="mt-2 text-lg font-semibold">{area}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Module phục vụ demo SOAR end-to-end, ưu tiên khả năng giải thích và trình bày trong báo cáo.
            </p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {SOAR_SCOPE_GUARDRAILS.map((guardrail) => (
          <article
            key={guardrail.title}
            className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Giới hạn phạm vi
            </p>
            <h3 className="mt-2 text-lg font-semibold">{guardrail.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{guardrail.description}</p>
          </article>
        ))}
      </section>
      <FutureNote note="Giao diện không mở rộng thành SIEM hoặc IDS. PCAP chỉ là nguồn tạo cảnh báo demo để kích hoạt luồng SOAR phía sau." />
    </>
  );
}
