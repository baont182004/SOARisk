'use client';

import type {
  Recommendation,
  RecommendationExplanation,
  WorkflowExecution,
} from '@soc-soar/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchApi, fetchOptionalApi } from '../lib/api';
import { DetailCard } from './detail-card';
import { EmptyState } from './empty-state';
import { formatStatusVi } from './status-badge';

type RecommendationDetailProps = {
  recommendationId: string;
};

export function RecommendationDetail({ recommendationId }: RecommendationDetailProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectingPlaybookId, setSelectingPlaybookId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<RecommendationExplanation | null>(null);
  const [generatingExplanation, setGeneratingExplanation] = useState(false);
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [creatingWorkflow, setCreatingWorkflow] = useState(false);

  useEffect(() => {
    let active = true;

    const loadRecommendation = async () => {
      try {
        const [recommendationResponse, explanationResponse, workflowResponse] = await Promise.all([
          fetchApi<Recommendation>(`/recommendations/${recommendationId}`, {
            cache: 'no-store',
          }),
          fetchOptionalApi<RecommendationExplanation>(
            `/explanations/by-recommendation/${recommendationId}`,
            {
              cache: 'no-store',
            },
          ),
          fetchApi<WorkflowExecution[]>(
            `/workflows?recommendationId=${recommendationId}&limit=1&page=1`,
            {
              cache: 'no-store',
            },
          ),
        ]);

        if (!active) {
          return;
        }

        setRecommendation(recommendationResponse.data);
        setExplanation(explanationResponse?.data ?? null);
        setWorkflow(workflowResponse.data[0] ?? null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Không tải được khuyến nghị.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRecommendation().catch(() => undefined);

    return () => {
      active = false;
    };
  }, [recommendationId]);

  const handleGenerateExplanation = async () => {
    setGeneratingExplanation(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<RecommendationExplanation>(
        `/explanations/from-recommendation/${recommendationId}`,
        {
          method: 'POST',
        },
      );

      setExplanation(response.data);
      setMessage(response.message);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Không thể tạo giải thích.',
      );
    } finally {
      setGeneratingExplanation(false);
    }
  };

  const handleCreateWorkflow = async () => {
    setCreatingWorkflow(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<WorkflowExecution>(
        `/workflows/from-recommendation/${recommendationId}`,
        {
          method: 'POST',
        },
      );

      setWorkflow(response.data);
      setMessage(response.message);
    } catch (workflowError) {
      setError(
        workflowError instanceof Error ? workflowError.message : 'Không thể tạo workflow.',
      );
    } finally {
      setCreatingWorkflow(false);
    }
  };

  const handleSelectPlaybook = async (playbookId: string) => {
    setSelectingPlaybookId(playbookId);
    setMessage(null);
    setError(null);

    try {
      const response = await fetchApi<Recommendation>(
        `/recommendations/${recommendationId}/select/${playbookId}`,
        {
          method: 'POST',
        },
      );

      setRecommendation(response.data);
      setMessage(response.message);
    } catch (selectError) {
      setError(selectError instanceof Error ? selectError.message : 'Không thể chọn playbook.');
    } finally {
      setSelectingPlaybookId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Đang tải chi tiết khuyến nghị...</p>
      </section>
    );
  }

  if (error && !recommendation) {
    return (
      <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
        <p className="text-sm text-rose-800">{error}</p>
      </section>
    );
  }

  if (!recommendation) {
    return <EmptyState message="Không tìm thấy khuyến nghị." />;
  }

  return (
    <div className="space-y-6">
      <DetailCard
        title="Tóm tắt khuyến nghị"
        items={[
          { label: 'Recommendation ID', value: recommendation.recommendationId },
          { label: 'Alert chuẩn hóa', value: recommendation.normalizedAlertId },
          { label: 'Raw Alert ID', value: recommendation.alertId },
          { label: 'Loại alert', value: recommendation.alertType },
          { label: 'Mức độ', value: recommendation.severity },
          { label: 'Trạng thái', value: formatStatusVi(recommendation.status) },
          {
            label: 'Playbook đã chọn',
            value: recommendation.selectedPlaybookId ?? 'chưa chọn',
          },
          {
            label: 'Playbook đã đánh giá',
            value: String(recommendation.evaluatedPlaybookCount),
          },
        ]}
      />

      {recommendation.status === 'selected' ? (
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Workflow</h3>
              <p className="mt-2 text-sm text-slate-600">
                Tạo workflow mô phỏng từ khuyến nghị và playbook đã chọn.
              </p>
            </div>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creatingWorkflow}
              onClick={handleCreateWorkflow}
              type="button"
            >
              {creatingWorkflow ? 'Đang tạo...' : 'Tạo workflow'}
            </button>
          </div>
          {workflow ? (
            <div className="mt-4 rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow ID</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {workflow.executionId}
                  </p>
                </div>
                <Link
                  className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
                  href={`/workflows/${workflow.executionId}`}
                >
                  Xem workflow
                </Link>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Trạng thái: {formatStatusVi(workflow.status)}. Bước hiện tại: {workflow.currentStep}.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              Chưa có workflow cho khuyến nghị này.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Giải thích</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tạo bản giải thích dễ đọc cho analyst từ khuyến nghị này.
            </p>
          </div>
          <button
            className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={generatingExplanation}
            onClick={handleGenerateExplanation}
            type="button"
          >
            {generatingExplanation
              ? 'Đang tạo...'
              : explanation
                ? 'Tạo lại giải thích'
                : 'Tạo giải thích'}
          </button>
        </div>
        {explanation ? (
          <div className="mt-4 rounded-2xl bg-[var(--panel-muted)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Explanation ID
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800">
                  {explanation.explanationId}
                </p>
              </div>
              <Link
                className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
                href={`/explanations/${explanation.explanationId}`}
              >
                Xem giải thích
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-700">{explanation.summary}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            Chưa có giải thích cho khuyến nghị này.
          </p>
        )}
      </section>

      {message ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm text-emerald-800">{message}</p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-6 shadow-sm">
          <p className="text-sm text-rose-800">{error}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Playbook đã xếp hạng</h3>
        <div className="mt-4 space-y-4">
          {recommendation.topPlaybooks.map((playbook) => (
            <div key={playbook.playbookId} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Hạng {playbook.rank}
                </span>
                <span className="font-semibold text-slate-800">
                  {playbook.playbookId} {playbook.name}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Điểm {playbook.finalScore ?? playbook.totalScore}
                </span>
                {playbook.confidenceBand ? (
                  <span className="rounded-full bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {playbook.confidenceBand === 'high'
                      ? 'Tin cậy cao'
                      : playbook.confidenceBand === 'medium'
                        ? 'Tin cậy trung bình'
                        : 'Tin cậy thấp'}
                  </span>
                ) : null}
                {playbook.approvalRisk ? (
                  <span className="rounded-full bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-200">
                    Rủi ro phê duyệt: {playbook.approvalRisk}
                  </span>
                ) : null}
                {playbook.automationSuitability !== undefined ? (
                  <span className="rounded-full bg-violet-950/40 px-3 py-1 text-xs font-semibold text-violet-200">
                    Automation suitability: {Math.round(playbook.automationSuitability * 100)}%
                  </span>
                ) : null}
                {playbook.mitreTechniques?.slice(0, 3).map((technique) => (
                  <span
                    className="rounded-full bg-[var(--panel)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]"
                    key={technique.id}
                  >
                    {technique.id}
                  </span>
                ))}
              </div>
              {playbook.explanation ? (
                <p className="mt-3 rounded-2xl bg-[var(--panel)] p-4 text-sm text-[var(--text-muted)]">
                  {playbook.explanation}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                {(playbook.matchedCriteria ?? []).map((criterion) => (
                  <span
                    className="rounded-full bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-200"
                    key={criterion}
                  >
                    Khớp: {criterion}
                  </span>
                ))}
                {(playbook.missingCriteria ?? []).slice(0, 4).map((criterion) => (
                  <span
                    className="rounded-full bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-200"
                    key={criterion}
                  >
                    Thiếu/yếu: {criterion}
                  </span>
                ))}
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <MetricCard label="Nhóm incident" value={playbook.incidentCategory} />
                <MetricCard label="Tự động hóa" value={playbook.automationLevel} />
                <MetricCard
                  label="Cần phê duyệt"
                  value={playbook.approvalRequired ? 'Có' : 'Không'}
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextList title="Lý do khớp" items={playbook.matchedReasons} />
                <TextList title="Trường còn thiếu" items={playbook.missingFields} emptyText="Không có." />
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Phân rã điểm
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Loại alert"
                    value={String(playbook.scoreBreakdown.alertTypeScore)}
                  />
                  <MetricCard
                    label="Trường bắt buộc"
                    value={String(playbook.scoreBreakdown.requiredFieldsScore)}
                  />
                  <MetricCard
                    label="Mức độ"
                    value={String(playbook.scoreBreakdown.severityScore)}
                  />
                  <MetricCard
                    label="Ngữ cảnh tài sản"
                    value={String(playbook.scoreBreakdown.assetContextScore)}
                  />
                  <MetricCard
                    label="Điều kiện"
                    value={String(
                      playbook.scoreBreakdown.indicatorContextScore ??
                        playbook.scoreBreakdown.conditionScore ??
                        0,
                    )}
                  />
                  <MetricCard
                    label="MITRE"
                    value={String(playbook.scoreBreakdown.mitreTechniqueScore ?? 0)}
                  />
                  <MetricCard
                    label="Nguồn tin"
                    value={String(playbook.scoreBreakdown.sourceReliabilityScore ?? 0)}
                  />
                  <MetricCard
                    label="Penalty"
                    value={String(playbook.scoreBreakdown.penaltyScore ?? 0)}
                  />
                  <MetricCard
                    label="Tự động hóa"
                    value={String(playbook.scoreBreakdown.automationScore)}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Tổng điểm: {playbook.scoreBreakdown.totalScore}
                </p>
                {playbook.criteriaBreakdown && playbook.criteriaBreakdown.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {playbook.criteriaBreakdown.map((criterion) => (
                      <div
                        className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3 text-sm"
                        key={criterion.criterion}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[var(--text-main)]">
                            {criterion.criterion}
                          </span>
                          <span className="font-mono text-xs text-[var(--text-muted)]">
                            +{criterion.weightedContribution}
                          </span>
                        </div>
                        <p className="mt-2 text-[var(--text-muted)]">{criterion.evidence}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-4">
                <button
                  className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectingPlaybookId !== null}
                  onClick={() => handleSelectPlaybook(playbook.playbookId)}
                  type="button"
                >
                  {selectingPlaybookId === playbook.playbookId ? 'Đang chọn...' : 'Chọn playbook'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

function TextList({
  title,
  items,
  emptyText = 'Không có.',
}: {
  title: string;
  items: string[];
  emptyText?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-700">{emptyText}</p>
      ) : (
        <ul className="mt-2 space-y-2 text-sm text-slate-700">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
