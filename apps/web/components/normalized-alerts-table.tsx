'use client';

import type { ApiCollectionMeta, NormalizedAlert } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { GenerateRecommendationButton } from './generate-recommendation-button';
import { StatusBadge, SeverityBadge, formatSourceLabel } from './status-badge';
import { FilterBar, SelectFilter, TextFilter, alertTypeOptions, severityOptions } from './table-filters';

export function NormalizedAlertsTable() {
  const [alerts, setAlerts] = useState<NormalizedAlert[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [alertType, setAlertType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [rawAlertId, setRawAlertId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadAlerts = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (alertType) params.set('alertType', alertType);
      if (severity) params.set('severity', severity);
      if (status) params.set('normalizationStatus', status);
      if (rawAlertId) params.set('rawAlertId', rawAlertId);

      try {
        const response = await fetchApi<NormalizedAlert[], ApiCollectionMeta>(
          `/normalized-alerts?${params}`,
          { cache: 'no-store' },
        );
        if (!active) return;
        setAlerts(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được cảnh báo chuẩn hóa.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAlerts().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [alertType, limit, page, rawAlertId, severity, status]);

  const columns = useMemo<Array<DataTableColumn<NormalizedAlert>>>(
    () => [
      { key: 'normalizedAlertId', header: 'Normalized ID', className: 'min-w-44', render: (alert) => <span className="font-mono text-xs">{alert.normalizedAlertId}</span> },
      {
        key: 'alertId',
        header: 'Raw Alert',
        render: (alert) => (
          <Link className="text-teal-700 underline" href={`/alerts/${alert.alertId}`}>
            {alert.alertId}
          </Link>
        ),
      },
      { key: 'source', header: 'Source', render: (alert) => formatSourceLabel(alert.source) },
      { key: 'alertType', header: 'Alert type', render: (alert) => alert.alertType },
      { key: 'severity', header: 'Severity', render: (alert) => <SeverityBadge severity={alert.severity} /> },
      { key: 'confidence', header: 'Confidence', render: (alert) => `${alert.confidence}%` },
      { key: 'status', header: 'Status', render: (alert) => <StatusBadge status={alert.normalizationStatus} /> },
      { key: 'createdAt', header: 'Created time', render: (alert) => new Date(alert.createdAt).toLocaleString() },
      { key: 'action', header: 'Action', render: (alert) => <GenerateRecommendationButton normalizedAlertId={alert.normalizedAlertId} /> },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={alerts}
      emptyMessage="No normalized alerts match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Alert type" onChange={(value) => { setPage(1); setAlertType(value); }} options={alertTypeOptions} value={alertType} />
          <SelectFilter label="Severity" onChange={(value) => { setPage(1); setSeverity(value); }} options={severityOptions} value={severity} />
          <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'normalized', label: 'normalized' }, { value: 'pending', label: 'pending' }, { value: 'failed', label: 'failed' }]} value={status} />
          <TextFilter label="Raw Alert ID" onChange={(value) => { setPage(1); setRawAlertId(value); }} placeholder="ALERT-..." value={rawAlertId} />
        </FilterBar>
      }
      getRowKey={(alert) => alert.normalizedAlertId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Normalization"
      total={total}
    />
  );
}
