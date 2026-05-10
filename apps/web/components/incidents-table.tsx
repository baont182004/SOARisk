'use client';

import type { ApiCollectionMeta, Incident } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { SeverityBadge, StatusBadge } from './status-badge';

export function IncidentsTable() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadIncidents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchApi<Incident[], ApiCollectionMeta>(
          `/incidents?limit=${limit}&page=${page}`,
          { cache: 'no-store' },
        );
        if (!active) return;
        setIncidents(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách incident.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadIncidents().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [limit, page]);

  const columns = useMemo<Array<DataTableColumn<Incident>>>(
    () => [
      {
        key: 'incidentId',
        header: 'Incident ID',
        render: (incident) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/incidents/${incident.incidentId}`}>
            {incident.incidentId}
          </Link>
        ),
      },
      { key: 'title', header: 'Title', className: 'min-w-64', render: (incident) => incident.title },
      { key: 'severity', header: 'Severity', render: (incident) => <SeverityBadge severity={incident.severity} /> },
      { key: 'status', header: 'Status', render: (incident) => <StatusBadge status={incident.status} /> },
      {
        key: 'workflow',
        header: 'Workflow',
        render: (incident) => incident.executionId ? (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/workflows/${incident.executionId}`}>
            {incident.executionId}
          </Link>
        ) : (
          'Pending'
        ),
      },
      { key: 'updatedAt', header: 'Updated time', render: (incident) => new Date(incident.updatedAt).toLocaleString() },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={incidents}
      emptyMessage="No incidents found."
      error={error}
      getRowKey={(incident) => incident.incidentId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Incident Tracking"
      total={total}
    />
  );
}
