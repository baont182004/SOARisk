'use client';

import Link from 'next/link';
import { useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge, formatStatusVi } from './status-badge';

const demoScenarios = [
  { id: 'port-scan', label: 'Quét cổng (Port scan)' },
  { id: 'icmp-flood', label: 'ICMP flood / DoS' },
  { id: 'sql-injection', label: 'SQL injection' },
  { id: 'xss', label: 'XSS' },
  { id: 'suspicious-dns', label: 'DNS đáng ngờ' },
  { id: 'botnet-c2', label: 'Botnet / C2' },
];

const stepLabels: Record<string, string> = {
  seed: 'Đồng bộ dataset playbook',
  alert: 'Tạo cảnh báo demo',
  normalize: 'Chuẩn hóa cảnh báo',
  recommend: 'Gợi ý playbook Top-3',
  recommendation: 'Gợi ý playbook Top-3',
  select: 'Chọn playbook kỳ vọng',
  explain: 'Giải thích khuyến nghị',
  explanation: 'Giải thích khuyến nghị',
  workflow: 'Khởi chạy workflow',
  approval: 'Phê duyệt của analyst',
  report: 'Tạo incident, báo cáo và cập nhật dashboard',
};

type DemoStep = {
  key: string;
  label: string;
  status: 'completed' | 'waiting_approval' | 'failed';
  ref?: string;
  message?: string;
};

type DemoRunResult = {
  scenario: string;
  alertId?: string;
  normalizedAlertId?: string;
  recommendationId?: string;
  selectedPlaybookId?: string;
  explanationId?: string;
  executionId?: string;
  pendingApprovalId?: string;
  workflowStatus?: string;
  steps: DemoStep[];
};

type ApprovalDecisionResponse = {
  workflowExecution: {
    executionId: string;
    status: string;
  };
};

export function DemoWizard() {
  const [scenario, setScenario] = useState('port-scan');
  const [result, setResult] = useState<DemoRunResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDemo = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetchApi<DemoRunResult>(`/demo/run/${scenario}`, {
        method: 'POST',
      });
      setResult(response.data);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Không thể chạy demo SOAR.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!result?.pendingApprovalId) {
      return;
    }

    setApproving(true);
    setError(null);

    try {
      const response = await fetchApi<ApprovalDecisionResponse>(
        `/approvals/${result.pendingApprovalId}/approve`,
        {
          method: 'POST',
          body: JSON.stringify({
            decidedBy: 'demo-analyst',
            decisionReason: 'Đã phê duyệt trong Demo Wizard SOAR.',
          }),
        },
      );

      const { pendingApprovalId, ...rest } = result;
      void pendingApprovalId;

      setResult({
        ...rest,
        workflowStatus: response.data.workflowExecution.status,
        steps: [
          ...result.steps.filter((step) => step.key !== 'approval'),
          {
            key: 'approval',
            label: 'Analyst đã phê duyệt',
            status: 'completed',
            ref: result.pendingApprovalId,
          },
          {
            key: 'report',
            label: 'Incident và báo cáo đã được cập nhật',
            status: 'completed',
            ref: response.data.workflowExecution.executionId,
          },
        ],
      });
    } catch (approvalError) {
      setError(
        approvalError instanceof Error ? approvalError.message : 'Không thể phê duyệt workflow.',
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Kịch bản demo</span>
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-slate-800"
              onChange={(event) => setScenario(event.target.value)}
              value={scenario}
            >
              {demoScenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading || approving}
            onClick={runDemo}
            type="button"
          >
            {loading ? 'Đang chạy...' : 'Chạy demo SOAR'}
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-800">{error}</p>
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Trạng thái luồng demo</h3>
              <p className="mt-1 text-sm text-slate-600">
                Trạng thái workflow: {formatStatusVi(result.workflowStatus)}
              </p>
            </div>
            {result.pendingApprovalId ? (
              <button
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={approving}
                onClick={approve}
                type="button"
              >
                {approving ? 'Đang phê duyệt...' : 'Phê duyệt và tiếp tục'}
              </button>
            ) : null}
          </div>

          <div className="mt-5 space-y-3">
            {result.steps.map((step) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-4 py-3"
                key={`${step.key}-${step.ref ?? ''}`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {stepLabels[step.key] ?? step.label}
                  </p>
                  {step.message ? <p className="mt-1 text-xs text-slate-500">{step.message}</p> : null}
                </div>
                <StatusBadge status={step.status} />
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {result.alertId ? <Link className="text-teal-700 underline" href={`/alerts/${result.alertId}`}>Cảnh báo</Link> : null}
            {result.recommendationId ? <Link className="text-teal-700 underline" href={`/recommendations/${result.recommendationId}`}>Khuyến nghị</Link> : null}
            {result.explanationId ? <Link className="text-teal-700 underline" href={`/explanations/${result.explanationId}`}>Giải thích</Link> : null}
            {result.executionId ? <Link className="text-teal-700 underline" href={`/workflows/${result.executionId}`}>Workflow</Link> : null}
            <Link className="text-teal-700 underline" href="/incidents">Incident</Link>
            <Link className="text-teal-700 underline" href="/reports">Báo cáo</Link>
            <Link className="text-teal-700 underline" href="/evaluation">Đánh giá</Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
