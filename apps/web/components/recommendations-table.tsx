'use client';

import type { ApiCollectionMeta, Recommendation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { SeverityBadge, StatusBadge } from './status-badge';
import { FilterBar, SelectFilter, TextFilter, alertTypeOptions, severityOptions } from './table-filters';

export function RecommendationsTable() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [alertType, setAlertType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [normalizedAlertId, setNormalizedAlertId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (alertType) params.set('alertType', alertType);
      if (severity) params.set('severity', severity);
      if (status) params.set('status', status);
      if (normalizedAlertId) params.set('normalizedAlertId', normalizedAlertId);

      try {
        const response = await fetchApi<Recommendation[], ApiCollectionMeta>(
          `/recommendations?${params}`,
          { cache: 'no-store' },
        );
        if (!active) return;
        setRecommendations(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được danh sách khuyến nghị.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecommendations().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [alertType, limit, normalizedAlertId, page, severity, status]);

  const columns = useMemo<Array<DataTableColumn<Recommendation>>>(
    () => [
      {
        key: 'recommendationId',
        header: 'Recommendation ID',
        className: 'min-w-44',
        render: (recommendation) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/recommendations/${recommendation.recommendationId}`}>
            {recommendation.recommendationId}
          </Link>
        ),
      },
      { key: 'normalizedAlertId', header: 'Normalized Alert', render: (recommendation) => <span className="font-mono text-xs">{recommendation.normalizedAlertId}</span> },
      { key: 'alertType', header: 'Alert type', render: (recommendation) => recommendation.alertType },
      { key: 'severity', header: 'Severity', render: (recommendation) => <SeverityBadge severity={recommendation.severity} /> },
      { key: 'topPlaybook', header: 'Top-1 Playbook', render: (recommendation) => recommendation.topPlaybooks[0]?.playbookId ?? 'Not generated' },
      { key: 'score', header: 'Score', render: (recommendation) => {
        const topPlaybook = recommendation.topPlaybooks[0];
        return topPlaybook ? topPlaybook.finalScore ?? topPlaybook.totalScore : 'Pending';
      } },
      { key: 'status', header: 'Status', render: (recommendation) => <StatusBadge status={recommendation.status} /> },
      { key: 'createdAt', header: 'Created time', render: (recommendation) => recommendation.createdAt ? new Date(recommendation.createdAt).toLocaleString() : 'Pending' },
      {
        key: 'action',
        header: 'Action',
        render: (recommendation) => (
          <Link className="text-teal-700 underline" href={`/recommendations/${recommendation.recommendationId}`}>
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
      data={recommendations}
      emptyMessage="No recommendations match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Alert type" onChange={(value) => { setPage(1); setAlertType(value); }} options={alertTypeOptions} value={alertType} />
          <SelectFilter label="Severity" onChange={(value) => { setPage(1); setSeverity(value); }} options={severityOptions} value={severity} />
          <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'generated', label: 'generated' }, { value: 'selected', label: 'selected' }, { value: 'expired', label: 'expired' }]} value={status} />
          <TextFilter label="Normalized ID" onChange={(value) => { setPage(1); setNormalizedAlertId(value); }} placeholder="NAL-..." value={normalizedAlertId} />
        </FilterBar>
      }
      getRowKey={(recommendation) => recommendation.recommendationId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Playbook Recommendation"
      total={total}
    />
  );
}
