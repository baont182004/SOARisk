'use client';

import type { ApprovalRequest, WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { formatStatusVi } from './status-badge';

type ApprovalDecisionResponse = {
  approvalRequest: ApprovalRequest;
  workflowExecution: WorkflowExecution;
};

type ApprovalDetailProps = {
  approvalId: string;
};

export function ApprovalDetail({ approvalId }: ApprovalDetailProps) {
  const [approval, setApproval] = useState<ApprovalRequest | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [decidedBy, setDecidedBy] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadApproval = async () => {
      try {
        const response = await fetchApi<ApprovalRequest>(`/approvals/${approvalId}`, {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setApproval(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Không tải được chi tiết phê duyệt.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadApproval().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [approvalId]);

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetchApi<ApprovalDecisionResponse>(
        `/approvals/${approvalId}/${decision}`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...(decidedBy ? { decidedBy } : {}),
            ...(decisionReason ? { decisionReason } : {}),
          }),
        },
      );

      setApproval(response.data.approvalRequest);
      setWorkflow(response.data.workflowExecution);
      setMessage(response.message);
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : `Không thể ${decision === 'approve' ? 'phê duyệt' : 'từ chối'} yêu cầu.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải chi tiết phê duyệt...</p>
      </section>
    );
  }

  if (error && !approval) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (!approval) {
    return <EmptyState message="Không tìm thấy yêu cầu phê duyệt." />;
  }

  const actionButtonsDisabled = submitting || approval.status !== 'pending';

  return (
    <div className="space-y-6">
      <DetailCard
        title="Tóm tắt phê duyệt"
        items={[
          { label: 'Approval ID', value: approval.approvalId },
          { label: 'Execution ID', value: approval.executionId },
          { label: 'Bước', value: String(approval.step) },
          { label: 'Hành động', value: approval.action },
          { label: 'Rủi ro', value: approval.risk },
          { label: 'Trạng thái', value: formatStatusVi(approval.status) },
          {
            label: 'Yêu cầu lúc',
            value: approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : 'chưa có',
          },
          { label: 'Người quyết định', value: approval.decidedBy ?? 'chưa có' },
        ]}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-700">
          Decision gate ghi nhận approver, lý do và trạng thái workflow để duy trì audit trail.
        </p>
      </section>

      {workflow ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Workflow liên kết</h3>
              <p className="mt-2 text-sm text-slate-600">
                Trạng thái workflow sau quyết định phê duyệt.
              </p>
            </div>
            <Link
              className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
              href={`/workflows/${workflow.executionId}`}
            >
              Xem workflow
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Trạng thái workflow: {formatStatusVi(workflow.status)}. Bước hiện tại: {workflow.currentStep}.
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Thông tin quyết định</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Người quyết định</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800"
              onChange={(event) => setDecidedBy(event.target.value)}
              placeholder="analyst-1"
              value={decidedBy}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Lý do quyết định</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800"
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder="Đã kiểm tra ngữ cảnh, rủi ro và tác động dự kiến."
              value={decisionReason}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={actionButtonsDisabled}
            onClick={() => handleDecision('approve')}
            type="button"
          >
            {submitting ? 'Đang gửi...' : 'Phê duyệt'}
          </button>
          <button
            className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={actionButtonsDisabled}
            onClick={() => handleDecision('reject')}
            type="button"
          >
            {submitting ? 'Đang gửi...' : 'Từ chối'}
          </button>
        </div>
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
    </div>
  );
}
