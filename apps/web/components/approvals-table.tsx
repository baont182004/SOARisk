'use client';

import type { ApprovalRequest } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

export function ApprovalsTable() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadApprovals = async () => {
      try {
        const response = await fetchApi<ApprovalRequest[]>('/approvals?limit=20&page=1', {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setApprovals(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Failed to load approvals.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadApprovals().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading approval requests from the API...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (approvals.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          No approval requests exist yet. Workflow execution will create them when sensitive mock steps are reached.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Approval Requests</h3>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          Analyst Gate
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Approval ID</th>
              <th className="px-3 py-3 font-semibold">Execution ID</th>
              <th className="px-3 py-3 font-semibold">Step</th>
              <th className="px-3 py-3 font-semibold">Action</th>
              <th className="px-3 py-3 font-semibold">Risk</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Requested At</th>
            </tr>
          </thead>
          <tbody>
            {approvals.map((approval) => (
              <tr
                key={approval.approvalId}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="px-3 py-3 font-mono text-xs">
                  <Link
                    className="text-teal-700 underline"
                    href={`/approvals/${approval.approvalId}`}
                  >
                    {approval.approvalId}
                  </Link>
                </td>
                <td className="px-3 py-3">{approval.executionId}</td>
                <td className="px-3 py-3">{approval.step}</td>
                <td className="px-3 py-3">{approval.action}</td>
                <td className="px-3 py-3">{approval.risk}</td>
                <td className="px-3 py-3">{approval.status}</td>
                <td className="px-3 py-3">
                  {approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : 'n/a'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
