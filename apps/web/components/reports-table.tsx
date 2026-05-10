'use client';

import type { ApiCollectionMeta, Report } from '@soc-soar/shared';
import { useEffect, useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge } from './status-badge';

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const exportReport = async (reportId: string, format: 'markdown' | 'html') => {
    try {
      const response = await fetchApi<{
        filename: string;
        contentType: string;
        content: string;
      }>(`/reports/${reportId}/export/${format}`, { cache: 'no-store' });
      const blob = new Blob([response.data.content], { type: response.data.contentType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.data.filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Không thể xuất báo cáo.');
    }
  };

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchApi<Report[], ApiCollectionMeta>(
          `/reports?limit=${limit}&page=${page}`,
          { cache: 'no-store' },
        );
        if (!active) return;
        setReports(response.data);
        setTotal(response.meta?.total ?? response.data.length);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : 'Không tải được báo cáo.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReports().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [limit, page]);

  const columns = useMemo<Array<DataTableColumn<Report>>>(
    () => [
      { key: 'reportId', header: 'Report ID', render: (report) => <span className="font-mono text-xs">{report.reportId}</span> },
      { key: 'incidentId', header: 'Incident ID', render: (report) => <span className="font-mono text-xs">{report.incidentId}</span> },
      { key: 'executionId', header: 'Execution ID', render: (report) => report.executionId ? <span className="font-mono text-xs">{report.executionId}</span> : 'Pending' },
      { key: 'finalStatus', header: 'Final status', render: (report) => <StatusBadge status={report.finalStatus} /> },
      { key: 'createdAt', header: 'Created time', render: (report) => new Date(report.createdAt).toLocaleString() },
      {
        key: 'export',
        header: 'Export',
        render: (report) => (
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-teal-700 px-3 py-1 text-xs font-semibold text-teal-800" onClick={() => exportReport(report.reportId, 'markdown')} type="button">
              Markdown
            </button>
            <button className="rounded-lg border border-teal-700 px-3 py-1 text-xs font-semibold text-teal-800" onClick={() => exportReport(report.reportId, 'html')} type="button">
              HTML
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={reports}
      emptyMessage="No reports found."
      error={error}
      getRowKey={(report) => report.reportId}
      limit={limit}
      loading={loading}
      onLimitChange={(nextLimit) => { setPage(1); setLimit(nextLimit); }}
      onPageChange={setPage}
      page={page}
      title="Reports"
      total={total}
    />
  );
}
