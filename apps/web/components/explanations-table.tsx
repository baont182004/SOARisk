'use client';

import type { ApiCollectionMeta, RecommendationExplanation } from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge } from './status-badge';
import { FilterBar, SelectFilter, TextFilter } from './table-filters';

export function ExplanationsTable() {
  const [explanations, setExplanations] = useState<RecommendationExplanation[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [recommendationId, setRecommendationId] = useState('');
  const [normalizedAlertId, setNormalizedAlertId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadExplanations = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (status) params.set('status', status);
      if (recommendationId) params.set('recommendationId', recommendationId);
      if (normalizedAlertId) params.set('normalizedAlertId', normalizedAlertId);

      try {
        const response = await fetchApi<RecommendationExplanation[], ApiCollectionMeta>(
          `/explanations?${params}`,
          { cache: 'no-store' },
        );
        if (!active) return;
        setExplanations(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được explanation.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadExplanations().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [limit, normalizedAlertId, page, recommendationId, status]);

  const columns = useMemo<Array<DataTableColumn<RecommendationExplanation>>>(
    () => [
      {
        key: 'explanationId',
        header: 'Explanation ID',
        className: 'min-w-44',
        render: (explanation) => (
          <Link className="font-mono text-xs text-teal-700 underline" href={`/explanations/${explanation.explanationId}`}>
            {explanation.explanationId}
          </Link>
        ),
      },
      { key: 'recommendationId', header: 'Recommendation', render: (explanation) => <span className="font-mono text-xs">{explanation.recommendationId}</span> },
      { key: 'normalizedAlertId', header: 'Normalized Alert', render: (explanation) => <span className="font-mono text-xs">{explanation.normalizedAlertId}</span> },
      { key: 'topPlaybookId', header: 'Top-1 Playbook', render: (explanation) => explanation.topPlaybookId },
      { key: 'status', header: 'Status', render: (explanation) => <StatusBadge status={explanation.status} /> },
      { key: 'createdAt', header: 'Created time', render: (explanation) => explanation.createdAt ? new Date(explanation.createdAt).toLocaleString() : 'Pending' },
      {
        key: 'action',
        header: 'Action',
        render: (explanation) => (
          <Link className="text-teal-700 underline" href={`/explanations/${explanation.explanationId}`}>
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
      data={explanations}
      emptyMessage="No explanations match the current filters."
      error={error}
      filters={
        <FilterBar>
          <SelectFilter label="Status" onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: 'generated', label: 'generated' }, { value: 'stale', label: 'stale' }]} value={status} />
          <TextFilter label="Recommendation ID" onChange={(value) => { setPage(1); setRecommendationId(value); }} placeholder="REC-..." value={recommendationId} />
          <TextFilter label="Normalized ID" onChange={(value) => { setPage(1); setNormalizedAlertId(value); }} placeholder="NAL-..." value={normalizedAlertId} />
        </FilterBar>
      }
      getRowKey={(explanation) => explanation.explanationId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Decision Rationale"
      total={total}
    />
  );
}
