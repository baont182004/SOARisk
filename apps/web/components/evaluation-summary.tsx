'use client';

import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { formatStatusVi } from './status-badge';

type EvaluationSummary = {
  recommendation: {
    evaluatedCount: number;
    top1Accuracy: number;
    top3Accuracy: number;
    expectedPlaybookByAlertType: Record<string, string>;
    model?: string;
  };
  baseline: ModelEvaluationSummary;
  proposed: ModelEvaluationSummary;
  workflow: {
    total: number;
    terminal: number;
    successRate: number;
    averageExecutionTimeMs: number;
    manualStepReduction: {
      baselineManualSteps: number;
      remainingManualApprovalSteps: number;
      reducedSteps: number;
      reductionRate: number;
    };
  };
  distribution: {
    incidentsByStatus: Record<string, number>;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    playbookUsageCount: Record<string, number>;
  };
  demoDataset: Array<{ alertType: string; expectedPlaybookId: string }>;
  notes: string[];
};

type ModelEvaluationSummary = {
  model: 'baseline' | 'proposed';
  evaluatedCount: number;
  top1Accuracy: number;
  top3Accuracy: number;
  meanReciprocalRank: number;
  averageScoreCorrectTop1: number;
  averageScoreIncorrectTop1: number;
  mismatchCases: Array<{
    caseId: string;
    alertType: string;
    expectedTop1: string;
    actualTop1: string | null;
    actualTop3: string[];
    rationale: string;
  }>;
  byAlertType: Record<
    string,
    {
      evaluatedCount: number;
      top1Accuracy: number;
      top3Accuracy: number;
    }
  >;
  mismatchSummaryByAlertType: Record<string, number>;
  confusionPairs: Record<string, number>;
};

export function EvaluationSummaryPanel() {
  const [summary, setSummary] = useState<EvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        const response = await fetchApi<EvaluationSummary>('/evaluation/summary', {
          cache: 'no-store',
        });

        if (active) {
          setSummary(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu đánh giá.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PanelMessage message="Đang tải chỉ số đánh giá..." />;
  }

  if (error) {
    return <PanelMessage message={error} tone="error" />;
  }

  if (!summary) {
    return <PanelMessage message="Chưa có dữ liệu đánh giá." />;
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Độ chính xác Top-1" value={formatPercent(summary.recommendation.top1Accuracy)} />
        <MetricCard label="Độ chính xác Top-3" value={formatPercent(summary.recommendation.top3Accuracy)} />
        <MetricCard label="Baseline Top-1" value={formatPercent(summary.baseline.top1Accuracy)} />
        <MetricCard label="Proposed MRR" value={summary.proposed.meanReciprocalRank.toFixed(2)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ModelComparisonCard title="Baseline theo alertType" model={summary.baseline} />
        <ModelComparisonCard title="SOARISK-RS-V2 weighted" model={summary.proposed} />
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Workflow thành công" value={formatPercent(summary.workflow.successRate)} />
        <MetricCard
          label="Giảm thao tác thủ công"
          value={formatPercent(summary.workflow.manualStepReduction.reductionRate)}
        />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Mismatch cases của model đề xuất</h3>
        {summary.proposed.mismatchCases.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Không có case lệch Top-1 trong dataset đánh giá.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Case</th>
                  <th className="px-3 py-3 font-semibold">Alert</th>
                  <th className="px-3 py-3 font-semibold">Kỳ vọng</th>
                  <th className="px-3 py-3 font-semibold">Top-1 thực tế</th>
                  <th className="px-3 py-3 font-semibold">Top-3</th>
                </tr>
              </thead>
              <tbody>
                {summary.proposed.mismatchCases.slice(0, 10).map((entry) => (
                  <tr className="border-b border-[var(--border)] last:border-b-0" key={entry.caseId}>
                    <td className="px-3 py-3 font-mono text-xs">{entry.caseId}</td>
                    <td className="px-3 py-3">{entry.alertType}</td>
                    <td className="px-3 py-3 font-mono text-xs">{entry.expectedTop1}</td>
                    <td className="px-3 py-3 font-mono text-xs">{entry.actualTop1 ?? 'none'}</td>
                    <td className="px-3 py-3 font-mono text-xs">{entry.actualTop3.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <DistributionCard title="Alert theo loại" values={summary.distribution.alertsByType} />
        <DistributionCard title="Tần suất dùng playbook" values={summary.distribution.playbookUsageCount} />
        <DistributionCard title="Incident theo trạng thái" values={summary.distribution.incidentsByStatus} translateKeys />
        <DistributionCard title="Alert theo mức độ" values={summary.distribution.alertsBySeverity} />
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <h3 className="text-lg font-semibold">Ground-truth evaluation set</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-slate-500">
                <th className="px-3 py-3 font-semibold">Loại alert</th>
                <th className="px-3 py-3 font-semibold">Playbook kỳ vọng</th>
              </tr>
            </thead>
            <tbody>
              {summary.demoDataset.map((entry) => (
                <tr className="border-b border-[var(--border)] last:border-b-0" key={entry.alertType}>
                  <td className="px-3 py-3">{entry.alertType}</td>
                  <td className="px-3 py-3 font-mono text-xs">{entry.expectedPlaybookId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
    </section>
  );
}

function DistributionCard({
  title,
  values,
  translateKeys,
}: {
  title: string;
  values: Record<string, number>;
  translateKeys?: boolean;
}) {
  const entries = Object.entries(values);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Chưa có dữ liệu.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {entries.map(([key, count]) => (
            <div className="flex items-center justify-between text-sm" key={key}>
              <span className="text-slate-600">{translateKeys ? formatStatusVi(key) : key}</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ModelComparisonCard({
  title,
  model,
}: {
  title: string;
  model: ModelEvaluationSummary;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <MetricCard label="Top-1" value={formatPercent(model.top1Accuracy)} />
        <MetricCard label="Top-3" value={formatPercent(model.top3Accuracy)} />
        <MetricCard label="MRR" value={model.meanReciprocalRank.toFixed(2)} />
        <MetricCard label="Mismatch" value={String(model.mismatchCases.length)} />
      </div>
      <DistributionCard title="Top-1 theo alert type" values={percentMap(model.byAlertType)} />
    </section>
  );
}

function percentMap(
  values: ModelEvaluationSummary['byAlertType'],
) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      Math.round(value.top1Accuracy * 100),
    ]),
  );
}

function PanelMessage({ message, tone }: { message: string; tone?: 'error' }) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-[var(--border)] bg-[var(--panel)] text-slate-600'
      }`}
    >
      <p className="text-sm">{message}</p>
    </section>
  );
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
