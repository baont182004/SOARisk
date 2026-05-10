'use client';

import type { ApiCollectionMeta, WorkflowExecution } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge } from './status-badge';
import { FilterBar, SelectFilter, TextFilter } from './table-filters';

export function WorkflowsTable() {
  const [workflows, setWorkflows] = useState<WorkflowExecution[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [recommendationId, setRecommendationId] = useState('');
  const [playbookId, setPlaybookId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadWorkflows = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (status) params.set('status', status);
      if (recommendationId) params.set('recommendationId', recommendationId);
      if (playbookId) params.set('playbookId', playbookId);

      try {
        const response = await fetchApi<WorkflowExecution[], ApiCollectionMeta>(`/workflows?${params}`, {
          cache: 'no-store',
        });
        if (!active) return;
        setWorkflows(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được workflow.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadWorkflows().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [limit, page, playbookId, recommendationId, status]);

  const columns = useMemo<Array<DataTableColumn<WorkflowExecution>>>(
    () => [
      {
        key: 'executionId',
        header: 'Execution ID',
        render: (workflow) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/workflows/${workflow.executionId}`}>
            {workflow.executionId}
          </Link>
        ),
      },
      { key: 'recommendationId', header: 'Recommendation', render: (workflow) => <span className="font-mono text-xs">{workflow.recommendationId}</span> },
      { key: 'playbookId', header: 'Playbook', render: (workflow) => workflow.playbookId },
      { key: 'status', header: 'Status', render: (workflow) => <StatusBadge status={workflow.status} /> },
      { key: 'currentStep', header: 'Current step', render: (workflow) => workflow.currentStep },
      { key: 'createdAt', header: 'Created time', render: (workflow) => workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : 'Pending' },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={workflows}
      emptyMessage="No workflow executions match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'pending', label: 'pending' }, { value: 'running', label: 'running' }, { value: 'waiting_approval', label: 'waiting_approval' }, { value: 'success', label: 'success' }, { value: 'failed', label: 'failed' }, { value: 'cancelled', label: 'cancelled' }]} value={status} />
          <TextFilter label="Recommendation ID" onChange={(value) => { setPage(1); setRecommendationId(value); }} placeholder="REC-..." value={recommendationId} />
          <TextFilter label="Playbook ID" onChange={(value) => { setPage(1); setPlaybookId(value); }} placeholder="PB-..." value={playbookId} />
        </FilterBar>
      }
      getRowKey={(workflow) => workflow.executionId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Workflow Execution"
      total={total}
    />
  );
}
