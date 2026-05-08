'use client';

import type { WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge } from './status-badge';

export function WorkflowsTable() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadWorkflows = async () => {
      try {
        const response = await fetchApi<WorkflowExecution[]>('/workflows?limit=20&page=1', {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setWorkflows(response.data);
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

    loadWorkflows().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải workflow từ API...</p>
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

  if (workflows.length === 0) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Chưa có workflow. Hãy chọn playbook từ một khuyến nghị và khởi chạy workflow.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflow đã chạy</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Execution ID</th>
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Playbook ID</th>
              <th className="px-3 py-3 font-semibold">Trạng thái</th>
              <th className="px-3 py-3 font-semibold">Bước hiện tại</th>
              <th className="px-3 py-3 font-semibold">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((workflow) => (
              <tr
                key={workflow.executionId}
                className="border-b border-[var(--border)] last:border-b-0"
              >
                <td className="px-3 py-3 font-mono text-xs">
                  <Link
                    className="text-teal-700 underline"
                    href={`/workflows/${workflow.executionId}`}
                  >
                    {workflow.executionId}
                  </Link>
                </td>
                <td className="px-3 py-3">{workflow.recommendationId}</td>
                <td className="px-3 py-3">{workflow.playbookId}</td>
                <td className="px-3 py-3"><StatusBadge status={workflow.status} /></td>
                <td className="px-3 py-3">{workflow.currentStep}</td>
                <td className="px-3 py-3">
                  {workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : 'chưa có'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
