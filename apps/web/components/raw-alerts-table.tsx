'use client';

import type { ApiCollectionMeta, RawAlert } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { FilterBar, SelectFilter, TextFilter, alertTypeOptions, severityOptions } from './table-filters';
import { SeverityBadge, formatSourceLabel } from './status-badge';

export function RawAlertsTable() {
  const [alerts, setAlerts] = useState<RawAlert[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [alertType, setAlertType] = useState('');
  const [severity, setSeverity] = useState('');
  const [source, setSource] = useState('');
  const [pcapJobId, setPcapJobId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });
      if (alertType) params.set('alertType', alertType);
      if (severity) params.set('severity', severity);
      if (source) params.set('source', source);
      if (pcapJobId) params.set('pcapJobId', pcapJobId);

      try {
        const response = await fetchApi<RawAlert[], ApiCollectionMeta>(`/alerts?${params}`, {
          cache: 'no-store',
        });

        if (!active) return;
        setAlerts(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách cảnh báo.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAlerts().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [alertType, limit, page, pcapJobId, severity, source]);

  const columns = useMemo<Array<DataTableColumn<RawAlert>>>(
    () => [
      {
        key: 'alertId',
        header: 'Alert ID',
        className: 'min-w-44',
        render: (alert) => <span className="font-mono text-xs">{alert.alertId}</span>,
      },
      { key: 'title', header: 'Title', className: 'min-w-64', render: (alert) => alert.title },
      { key: 'source', header: 'Source', render: (alert) => formatSourceLabel(alert.source) },
      { key: 'alertType', header: 'Alert type', render: (alert) => alert.alertType ?? 'Pending' },
      { key: 'severity', header: 'Severity', render: (alert) => <SeverityBadge severity={alert.severity} /> },
      {
        key: 'confidence',
        header: 'Confidence',
        render: (alert) => (alert.confidence !== undefined ? `${alert.confidence}%` : 'Pending'),
      },
      { key: 'createdAt', header: 'Created time', render: (alert) => new Date(alert.createdAt).toLocaleString() },
      {
        key: 'action',
        header: 'Action',
        render: (alert) => (
          <Link className="text-teal-700 underline" href={`/alerts/${alert.alertId}`}>
            View details
          </Link>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={alerts}
      emptyMessage="No raw alerts match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Alert type" onChange={(value) => { setPage(1); setAlertType(value); }} options={alertTypeOptions} value={alertType} />
          <SelectFilter label="Severity" onChange={(value) => { setPage(1); setSeverity(value); }} options={severityOptions} value={severity} />
          <SelectFilter
            label="Source"
            onChange={(value) => { setPage(1); setSource(value); }}
            options={[
              { value: 'pcap_demo', label: 'PCAP Intake' },
              { value: 'suricata', label: 'suricata' },
              { value: 'wazuh', label: 'wazuh' },
              { value: 'zeek', label: 'zeek' },
              { value: 'manual', label: 'manual' },
              { value: 'mock', label: 'mock' },
            ]}
            value={source}
          />
          <TextFilter label="PCAP job" onChange={(value) => { setPage(1); setPcapJobId(value); }} placeholder="PCAPJOB-..." value={pcapJobId} />
        </FilterBar>
      }
      getRowKey={(alert) => alert.alertId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Raw Alerts"
      total={total}
    />
  );
}
