'use client';

import type { ApprovalRequest, WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';

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

        setError(loadError instanceof Error ? loadError.message : 'Failed to load approval.');
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
          : `Failed to ${decision} approval request.`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading approval detail...</p>
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
    return <EmptyState message="Approval request not found." />;
  }

  const actionButtonsDisabled = submitting || approval.status !== 'pending';

  return (
    <div className="space-y-6">
      <DetailCard
        title="Approval Summary"
        items={[
          { label: 'Approval ID', value: approval.approvalId },
          { label: 'Execution ID', value: approval.executionId },
          { label: 'Step', value: String(approval.step) },
          { label: 'Action', value: approval.action },
          { label: 'Risk', value: approval.risk },
          { label: 'Status', value: approval.status },
          {
            label: 'Requested At',
            value: approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : 'n/a',
          },
          { label: 'Decided By', value: approval.decidedBy ?? 'not provided' },
        ]}
      />

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-amber-950">
          Approval continues mock workflow only. No real external security action is executed.
        </p>
      </section>

      {workflow ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Workflow Link</h3>
              <p className="mt-2 text-sm text-slate-600">
                Workflow status after this approval decision.
              </p>
            </div>
            <Link
              className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
              href={`/workflows/${workflow.executionId}`}
            >
              View Workflow
            </Link>
          </div>
          <p className="mt-3 text-sm text-slate-700">
            Workflow status: {workflow.status}. Current step: {workflow.currentStep}.
          </p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Decision Input</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Decided By</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800"
              onChange={(event) => setDecidedBy(event.target.value)}
              placeholder="analyst-1"
              value={decidedBy}
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Decision Reason</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800"
              onChange={(event) => setDecisionReason(event.target.value)}
              placeholder="Approved mock continuation after analyst review."
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
            {submitting ? 'Submitting...' : 'Approve'}
          </button>
          <button
            className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={actionButtonsDisabled}
            onClick={() => handleDecision('reject')}
            type="button"
          >
            {submitting ? 'Submitting...' : 'Reject'}
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
