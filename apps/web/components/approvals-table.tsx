'use client';

import type { ApiCollectionMeta, ApprovalRequest } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge } from './status-badge';
import { FilterBar, SelectFilter, TextFilter } from './table-filters';

export function ApprovalsTable() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [executionId, setExecutionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadApprovals = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (status) params.set('status', status);
      if (executionId) params.set('executionId', executionId);

      try {
        const response = await fetchApi<ApprovalRequest[], ApiCollectionMeta>(`/approvals?${params}`, {
          cache: 'no-store',
        });
        if (!active) return;
        setApprovals(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được yêu cầu phê duyệt.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadApprovals().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [executionId, limit, page, status]);

  const columns = useMemo<Array<DataTableColumn<ApprovalRequest>>>(
    () => [
      {
        key: 'approvalId',
        header: 'Approval ID',
        render: (approval) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/approvals/${approval.approvalId}`}>
            {approval.approvalId}
          </Link>
        ),
      },
      { key: 'executionId', header: 'Execution ID', render: (approval) => <span className="font-mono text-xs">{approval.executionId}</span> },
      { key: 'step', header: 'Step', render: (approval) => approval.step },
      { key: 'action', header: 'Action', className: 'min-w-64', render: (approval) => approval.action },
      { key: 'risk', header: 'Risk', render: (approval) => approval.risk },
      { key: 'status', header: 'Status', render: (approval) => <StatusBadge status={approval.status} /> },
      { key: 'requestedAt', header: 'Requested time', render: (approval) => new Date(approval.requestedAt).toLocaleString() },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={approvals}
      emptyMessage="No approval requests match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'pending', label: 'pending' }, { value: 'approved', label: 'approved' }, { value: 'rejected', label: 'rejected' }]} value={status} />
          <TextFilter label="Execution ID" onChange={(value) => { setPage(1); setExecutionId(value); }} placeholder="WF-..." value={executionId} />
        </FilterBar>
      }
      getRowKey={(approval) => approval.approvalId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Analyst Approval"
      total={total}
    />
  );
}
