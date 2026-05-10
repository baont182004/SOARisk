'use client';

import type { Playbook } from '@soc-soar/shared';
import { useEffect, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { formatStatusVi } from './status-badge';

type PlaybookDetailProps = {
  playbookId: string;
};

export function PlaybookDetail({ playbookId }: PlaybookDetailProps) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadPlaybook = async () => {
      try {
        const response = await fetchApi<Playbook>(`/playbooks/${playbookId}`, {
          cache: 'no-store',
        });

        if (!active) {
          return;
        }

        setPlaybook(response.data);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Không tải được playbook.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPlaybook().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [playbookId]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải chi tiết playbook...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (!playbook) {
    return <EmptyState message="Không tìm thấy playbook." />;
  }

  const sensitiveActions = playbook.actions.filter((action) => action.risk === 'sensitive');
  const approvalGatedActions = playbook.actions.filter((action) => action.mockOnly).length;

  return (
    <div className="space-y-6">
      <DetailCard
        title="Metadata playbook"
        items={[
          { label: 'Playbook ID', value: playbook.playbookId },
          { label: 'Tên', value: playbook.name },
          { label: 'Nhóm incident', value: playbook.incidentCategory },
          { label: 'Mức tự động hóa', value: playbook.automationLevel },
          {
            label: 'Automation suitability',
            value:
              playbook.automationSuitability !== undefined
                ? `${Math.round(playbook.automationSuitability * 100)}%`
                : 'chưa có',
          },
          { label: 'Approval risk', value: playbook.approvalRisk ?? 'chưa có' },
          { label: 'Cần phê duyệt', value: playbook.approvalRequired ? 'Có' : 'Không' },
          { label: 'Chính sách phê duyệt', value: playbook.approvalPolicy },
          { label: 'Trạng thái', value: formatStatusVi(playbook.status) },
          { label: 'Phiên bản', value: playbook.version },
        ]}
      />

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Phạm vi và điều kiện khớp</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FieldPanel label="Loại alert hỗ trợ" values={playbook.supportedAlertTypes} />
          <FieldPanel label="Mức độ áp dụng" values={playbook.severityRange} />
          <FieldPanel label="Trường bắt buộc" values={playbook.requiredFields} />
          <FieldPanel label="Trường tùy chọn" values={playbook.optionalFields} />
          <FieldPanel label="Ngữ cảnh tài sản" values={playbook.assetContext} />
          <FieldPanel
            label="MITRE ATT&CK"
            values={(playbook.mitreTechniques ?? []).map(
              (technique) => `${technique.id} ${technique.name}`,
            )}
          />
          <FieldPanel
            label="Tín hiệu scoring"
            values={[
              ...(playbook.scoringHints?.positiveSignals ?? []),
              ...(playbook.scoringHints?.negativeSignals ?? []).map((signal) => `negative:${signal}`),
            ]}
          />
          <FieldPanel label="Tags" values={playbook.tags} />
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Điều kiện khớp</h3>
        <div className="mt-4 space-y-4">
          {playbook.conditions.map((condition, index) => (
            <div key={`${condition.field}-${index}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <p className="text-sm font-semibold text-slate-800">
                {condition.field} {condition.operator}
                {condition.value !== undefined ? ` ${Array.isArray(condition.value) ? condition.value.join(', ') : String(condition.value)}` : ''}
              </p>
              <p className="mt-2 text-sm text-slate-700">{condition.description}</p>
              {condition.weightHint !== undefined ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trọng số gợi ý {condition.weightHint}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Hành động theo thứ tự</h3>
        <div className="mt-4 space-y-4">
          {playbook.actions.map((action) => (
            <div key={`${action.step}-${action.action}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Bước {action.step}
                </span>
                <span className="font-semibold text-slate-800">{action.action}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {action.type}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {action.risk}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-700">{action.description}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <FieldPanel label="Trường bắt buộc" values={action.requiredFields} compact />
                <FieldPanel label="Kết quả sinh ra" values={action.produces} compact />
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phê duyệt {action.approvalRequired ? 'bắt buộc' : 'không bắt buộc'} | Approval-gated{' '}
                {action.mockOnly ? 'có' : 'không'}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Tài liệu tham chiếu</h3>
        <div className="mt-4 space-y-4">
          {playbook.references.map((reference) => (
            <div key={`${reference.name}-${reference.type}`} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <p className="text-sm font-semibold text-slate-800">{reference.name}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {reference.type}
              </p>
              <p className="mt-2 text-sm text-slate-700">{reference.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-amber-900">Approval controls</h3>
        <div className="mt-3 space-y-2 text-sm text-amber-800">
          <p>Chính sách phê duyệt: {playbook.approvalPolicy}</p>
          <p>Hành động nhạy cảm: {sensitiveActions.length}</p>
          <p>Hành động cần kiểm soát phê duyệt: {approvalGatedActions} / {playbook.actions.length}</p>
          <p>Các bước rủi ro cao được đưa qua approval gate để analyst đánh giá tác động trước khi workflow tiếp tục.</p>
        </div>
      </section>
    </div>
  );
}

function FieldPanel({
  label,
  values,
  compact = false,
}: {
  label: string;
  values: string[];
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl bg-[var(--panel-muted)] ${compact ? 'p-3' : 'p-4'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">
        {values.length > 0 ? values.join(', ') : 'không có'}
      </p>
    </div>
  );
}
