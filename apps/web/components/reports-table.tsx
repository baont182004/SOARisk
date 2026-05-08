'use client';

import type { Report } from '@soc-soar/shared';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge, formatStatusVi } from './status-badge';

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
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
      setError(
        exportError instanceof Error ? exportError.message : 'Không thể xuất báo cáo.',
      );
    }
  };

  useEffect(() => {
    let active = true;

    const loadReports = async () => {
      try {
        const response = await fetchApi<Report[]>('/reports', { cache: 'no-store' });

        if (active) {
          setReports(response.data);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Không tải được báo cáo.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadReports().catch(() => undefined);

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <PanelMessage message="Đang tải báo cáo từ API..." />;
  }

  if (error) {
    return <PanelMessage message={error} tone="error" />;
  }

  if (reports.length === 0) {
    return <PanelMessage message="Chưa có báo cáo. Hãy hoàn thành hoặc từ chối workflow để sinh báo cáo." />;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Báo cáo đã sinh</h3>
        <StatusBadge status="live_api" />
      </div>
      <div className="space-y-4">
        {reports.map((report) => (
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4" key={report.reportId}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-mono text-sm font-semibold">{report.reportId}</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Incident {report.incidentId} | Trạng thái cuối: {formatStatusVi(report.finalStatus)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="rounded-lg border border-teal-700 px-3 py-1 text-xs font-semibold text-teal-800"
                  onClick={() => exportReport(report.reportId, 'markdown')}
                  type="button"
                >
                  Markdown
                </button>
                <button
                  className="rounded-lg border border-teal-700 px-3 py-1 text-xs font-semibold text-teal-800"
                  onClick={() => exportReport(report.reportId, 'html')}
                  type="button"
                >
                  HTML
                </button>
                <p className="text-xs text-slate-500">
                  {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm lg:grid-cols-2">
              <SummaryBlock title="Cảnh báo" value={report.alertSummary} />
              <SummaryBlock title="Playbook" value={report.playbookSummary} />
              <SummaryBlock title="Khuyến nghị" value={report.recommendationSummary} />
              <SummaryBlock title="Thực thi" value={report.executionSummary} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function SummaryBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className="mt-1 text-slate-700">{value}</p>
    </div>
  );
}

function PanelMessage({ message, tone }: { message: string; tone?: 'error' }) {
  return (
    <section
      className={`rounded-2xl border p-6 shadow-sm ${
        tone === 'error'
          ? 'border-rose-200 bg-rose-50 text-rose-800'
          : 'border-[var(--border)] bg-[var(--panel)] text-slate-600'
      }`}
    >
      <p className="text-sm">{message}</p>
    </section>
  );
}
