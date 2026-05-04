'use client';

import type { WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';

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

        setError(loadError instanceof Error ? loadError.message : 'Failed to load workflows.');
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
        <p className="text-sm text-slate-600">Loading workflow executions from the API...</p>
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
          No workflow executions exist yet. Create one from a selected recommendation first.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workflow Executions</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
          Live API
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-slate-500">
              <th className="px-3 py-3 font-semibold">Execution ID</th>
              <th className="px-3 py-3 font-semibold">Recommendation ID</th>
              <th className="px-3 py-3 font-semibold">Playbook ID</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Current Step</th>
              <th className="px-3 py-3 font-semibold">Created At</th>
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
                <td className="px-3 py-3">{workflow.status}</td>
                <td className="px-3 py-3">{workflow.currentStep}</td>
                <td className="px-3 py-3">
                  {workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : 'n/a'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
