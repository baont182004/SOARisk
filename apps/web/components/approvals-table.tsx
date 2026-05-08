'use client';

import type { ApprovalRequest } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

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

        setError(loadError instanceof Error ? loadError.message : 'Không tải được yêu cầu phê duyệt.');
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
        <p className="text-sm text-slate-600">Đang tải yêu cầu phê duyệt từ API...</p>
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
          Chưa có yêu cầu phê duyệt. Workflow sẽ tạo yêu cầu khi tới bước phản hồi mô phỏng nhạy cảm.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Yêu cầu phê duyệt</h3>
        <StatusBadge status="waiting_approval" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Approval ID</th>
              <th className="px-3 py-3 font-semibold">Execution ID</th>
              <th className="px-3 py-3 font-semibold">Bước</th>
              <th className="px-3 py-3 font-semibold">Hành động</th>
              <th className="px-3 py-3 font-semibold">Rủi ro</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Yêu cầu lúc</th>
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
                <td className="px-3 py-3"><StatusBadge status={approval.status} /></td>
                <td className="px-3 py-3">
                  {approval.requestedAt ? new Date(approval.requestedAt).toLocaleString() : 'chưa có'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
