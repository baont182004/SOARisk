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

        setError(loadError instanceof Error ? loadError.message : 'Failed to load recommendation.');
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
          : 'Failed to generate explanation.',
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
        workflowError instanceof Error ? workflowError.message : 'Failed to create workflow.',
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
      setError(selectError instanceof Error ? selectError.message : 'Failed to select playbook.');
    } finally {
      setSelectingPlaybookId(null);
    }
  };

  if (loading) {
    return (
      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <p className="text-sm text-slate-600">Loading recommendation detail...</p>
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
    return <EmptyState message="Recommendation not found." />;
  }

  return (
    <div className="space-y-6">
      <DetailCard
        title="Recommendation Summary"
        items={[
          { label: 'Recommendation ID', value: recommendation.recommendationId },
          { label: 'Normalized Alert ID', value: recommendation.normalizedAlertId },
          { label: 'Raw Alert ID', value: recommendation.alertId },
          { label: 'Alert Type', value: recommendation.alertType },
          { label: 'Severity', value: recommendation.severity },
          { label: 'Status', value: recommendation.status },
          {
            label: 'Selected Playbook',
            value: recommendation.selectedPlaybookId ?? 'not selected',
          },
          {
            label: 'Evaluated Playbooks',
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
                Create a mock-only workflow execution from the selected recommendation and playbook.
              </p>
            </div>
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={creatingWorkflow}
              onClick={handleCreateWorkflow}
              type="button"
            >
              {creatingWorkflow ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
          {workflow ? (
            <div className="mt-4 rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Workflow ID
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-800">
                    {workflow.executionId}
                  </p>
                </div>
                <Link
                  className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
                  href={`/workflows/${workflow.executionId}`}
                >
                  View Workflow
                </Link>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Status: {workflow.status}. Current step: {workflow.currentStep}.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No workflow has been created for this recommendation yet.
            </p>
          )}
        </section>
      ) : null}

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">Explanation</h3>
            <p className="mt-2 text-sm text-slate-600">
              Generate an analyst-readable explanation snapshot for this recommendation.
            </p>
          </div>
          <button
            className="rounded-xl bg-amber-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={generatingExplanation}
            onClick={handleGenerateExplanation}
            type="button"
          >
            {generatingExplanation
              ? 'Generating...'
              : explanation
                ? 'Generate Explanation'
                : 'Generate Explanation'}
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
                View Explanation
              </Link>
            </div>
            <p className="mt-3 text-sm text-slate-700">{explanation.summary}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            No explanation has been generated for this recommendation yet.
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
        <h3 className="text-lg font-semibold">Ranked Playbooks</h3>
        <div className="mt-4 space-y-4">
          {recommendation.topPlaybooks.map((playbook) => (
            <div key={playbook.playbookId} className="rounded-2xl bg-[var(--panel-muted)] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  Rank {playbook.rank}
                </span>
                <span className="font-semibold text-slate-800">
                  {playbook.playbookId} {playbook.name}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Score {playbook.totalScore}
                </span>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <MetricCard label="Incident Category" value={playbook.incidentCategory} />
                <MetricCard label="Automation" value={playbook.automationLevel} />
                <MetricCard
                  label="Approval Required"
                  value={playbook.approvalRequired ? 'yes' : 'no'}
                />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <TextList title="Matched Reasons" items={playbook.matchedReasons} />
                <TextList title="Missing Fields" items={playbook.missingFields} emptyText="None." />
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Score Breakdown
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <MetricCard
                    label="Alert Type"
                    value={String(playbook.scoreBreakdown.alertTypeScore)}
                  />
                  <MetricCard
                    label="Required Fields"
                    value={String(playbook.scoreBreakdown.requiredFieldsScore)}
                  />
                  <MetricCard
                    label="Severity"
                    value={String(playbook.scoreBreakdown.severityScore)}
                  />
                  <MetricCard
                    label="Asset Context"
                    value={String(playbook.scoreBreakdown.assetContextScore)}
                  />
                  <MetricCard
                    label="Conditions"
                    value={String(playbook.scoreBreakdown.conditionScore)}
                  />
                  <MetricCard
                    label="Automation"
                    value={String(playbook.scoreBreakdown.automationScore)}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-800">
                  Total Score: {playbook.scoreBreakdown.totalScore}
                </p>
              </div>
              <div className="mt-4">
                <button
                  className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={selectingPlaybookId !== null}
                  onClick={() => handleSelectPlaybook(playbook.playbookId)}
                  type="button"
                >
                  {selectingPlaybookId === playbook.playbookId ? 'Selecting...' : 'Select Playbook'}
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
  emptyText = 'None.',
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
