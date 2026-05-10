'use client';

import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  title: string;
  data: T[];
  columns: Array<DataTableColumn<T>>;
  getRowKey: (row: T) => string;
  page: number;
  limit: number;
  total: number;
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  filters?: ReactNode;
  actions?: ReactNode;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

const pageSizes = [10, 20, 30, 50];

export function DataTable<T>({
  title,
  data,
  columns,
  getRowKey,
  page,
  limit,
  total,
  loading,
  error,
  emptyMessage = 'No records found.',
  filters,
  actions,
  onPageChange,
  onLimitChange,
}: DataTableProps<T>) {
  const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] p-5">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {filters ? <div className="border-b border-[var(--border)] p-4">{filters}</div> : null}

      {loading ? (
        <PanelMessage message="Loading records..." />
      ) : error ? (
        <PanelMessage message={error} tone="error" />
      ) : data.length === 0 ? (
        <PanelMessage message={emptyMessage} />
      ) : (
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--panel-muted)] text-slate-500">
              <tr className="border-b border-[var(--border)]">
                {columns.map((column) => (
                  <th className={`px-3 py-3 font-semibold ${column.className ?? ''}`} key={column.key}>
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr className="border-b border-[var(--border)] last:border-b-0" key={getRowKey(row)}>
                  {columns.map((column) => (
                    <td className={`px-3 py-3 align-top ${column.className ?? ''}`} key={column.key}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] p-4 text-sm text-slate-600">
        <span>
          Hiển thị {start}-{end} trên tổng {total} bản ghi
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Rows
            <select
              className="rounded-lg border border-[var(--border)] px-2 py-1 text-sm normal-case tracking-normal"
              onChange={(event) => onLimitChange(Number(event.target.value))}
              value={limit}
            >
              {pageSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Trước
          </button>
          <span className="text-xs text-slate-500">
            {page}/{totalPages}
          </span>
          <button
            className="rounded-lg border border-[var(--border)] px-3 py-1 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Sau
          </button>
        </div>
      </div>
    </section>
  );
}

function PanelMessage({ message, tone }: { message: string; tone?: 'error' }) {
  return (
    <div className={tone === 'error' ? 'p-5 text-sm text-rose-800' : 'p-5 text-sm text-slate-600'}>
      {message}
    </div>
  );
}
