'use client';

import type { ApprovalRequest, ExecutionLog, WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { StatusBadge, formatStatusVi } from './status-badge';

type WorkflowDetailProps = {
  executionId: string;
};

export function WorkflowDetail({ executionId }: WorkflowDetailProps) {
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    const loadContext = async () => {
      try {
        const [workflowResponse, logsResponse, approvalsResponse] = await Promise.all([
          fetchApi<WorkflowExecution>(`/workflows/${executionId}`, {
            cache: 'no-store',
          }),
          fetchApi<ExecutionLog[]>(`/workflows/${executionId}/logs`, {
            cache: 'no-store',
          }),
          fetchApi<ApprovalRequest[]>(
            `/approvals?executionId=${executionId}&status=pending&limit=20&page=1`,
            {
              cache: 'no-store',
            },
          ),
        ]);

        if (!active) {
          return;
        }

        setWorkflow(workflowResponse.data);
        setLogs(logsResponse.data);
        setPendingApprovals(approvalsResponse.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Không tải được workflow.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadContext().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [executionId]);

  const reloadContext = async () => {
    const [workflowResponse, logsResponse, approvalsResponse] = await Promise.all([
      fetchApi<WorkflowExecution>(`/workflows/${executionId}`, {
        cache: 'no-store',
      }),
      fetchApi<ExecutionLog[]>(`/workflows/${executionId}/logs`, {
        cache: 'no-store',
      }),
      fetchApi<ApprovalRequest[]>(
        `/approvals?executionId=${executionId}&status=pending&limit=20&page=1`,
        {
          cache: 'no-store',
        },
      ),
    ]);

    setWorkflow(workflowResponse.data);
    setLogs(logsResponse.data);
    setPendingApprovals(approvalsResponse.data);
  };

  const handleStart = async () => {
    setStarting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<WorkflowExecution>(`/workflows/${executionId}/start`, {
        method: 'POST',
      });

      setWorkflow(response.data);
      setMessage(response.message);
      await reloadContext();
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Không thể chạy workflow.');
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<WorkflowExecution>(`/workflows/${executionId}/cancel`, {
        method: 'POST',
      });

      setWorkflow(response.data);
      setMessage(response.message);
      await reloadContext();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Không thể hủy workflow.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải chi tiết workflow...</p>
      </section>
    );
  }

  if (error && !workflow) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (!workflow) {
    return <EmptyState message="Không tìm thấy workflow." />;
  }

  const startButtonLabel =
    workflow.status === 'pending'
      ? 'Khởi chạy workflow'
      : workflow.status === 'waiting_approval'
        ? 'Tiếp tục workflow'
        : 'Tiếp tục workflow';
  const startDisabled =
    starting ||
    workflow.status === 'success' ||
    workflow.status === 'failed' ||
    workflow.status === 'cancelled' ||
    pendingApprovals.length > 0;
  const cancelDisabled =
    cancelling ||
    workflow.status === 'success' ||
    workflow.status === 'failed' ||
    workflow.status === 'cancelled';

  return (
    <div className="space-y-6">
      <DetailCard
        title="Tóm tắt workflow"
        items={[
          { label: 'Execution ID', value: workflow.executionId },
          { label: 'Recommendation ID', value: workflow.recommendationId },
          { label: 'Alert chuẩn hóa', value: workflow.normalizedAlertId },
          { label: 'Raw Alert ID', value: workflow.alertId },
          { label: 'Playbook ID', value: workflow.playbookId },
          { label: 'Trạng thái', value: formatStatusVi(workflow.status) },
          { label: 'Bước hiện tại', value: String(workflow.currentStep) },
        ]}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={startDisabled}
            onClick={handleStart}
            type="button"
          >
            {starting ? 'Đang chạy...' : startButtonLabel}
          </button>
          <button
            className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={cancelDisabled}
            onClick={handleCancel}
            type="button"
          >
            {cancelling ? 'Đang hủy...' : 'Hủy workflow'}
          </button>
        </div>
        {pendingApprovals.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-900">
              Workflow đang chờ analyst phê duyệt trước khi tiếp tục.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {pendingApprovals.map((approval) => (
                <Link
                  key={approval.approvalId}
                  className="rounded-xl border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900"
                  href={`/approvals/${approval.approvalId}`}
                >
                  Xem phê duyệt {approval.approvalId}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {message ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm text-emerald-800">{message}</p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm text-rose-800">{error}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Các bước workflow</h3>
        <div className="mt-4 space-y-4">
          {workflow.steps.map((step) => (
            <div key={`${workflow.executionId}-${step.step}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Bước {step.step}
                </span>
                <span className="font-semibold text-slate-900">{step.action}</span>
                <StatusBadge status={step.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{step.description}</p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <MetricCard label="Loại bước" value={step.type} />
                <MetricCard label="Phê duyệt" value={formatStatusVi(step.approvalStatus)} />
                <MetricCard label="Rủi ro" value={step.risk} />
                <MetricCard label="Demo action" value={step.mockOnly ? 'Có' : 'Không'} />
              </div>
              <p className="mt-4 text-sm text-slate-700">
                Kết quả: {step.result ?? 'Bước này chưa có kết quả.'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Log thực thi</h3>
        <div className="mt-4 space-y-3">
          {logs.length === 0 ? (
            <p className="text-sm text-slate-600">Chưa có log thực thi.</p>
          ) : (
            logs.map((log) => (
              <div key={log.logId} className="rounded-2xl bg-[var(--panel-muted)] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                    {log.level}
                  </span>
                  {log.step !== undefined ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Bước {log.step}
                    </span>
                  ) : null}
                  {log.action ? (
                    <span className="text-sm font-medium text-slate-800">{log.action}</span>
                  ) : null}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-700">{log.message}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'chưa có'}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}
