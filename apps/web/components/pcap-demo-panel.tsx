'use client';

import {
  RAW_ALERT_MOCK_SCENARIOS,
  type ApiCollectionMeta,
  type ApprovalRequest,
  type Incident,
  type NormalizedAlert,
  type PcapFile,
  type PcapJob,
  type RawAlert,
  type Recommendation,
  type RecommendationExplanation,
  type Report,
  type WorkflowExecution,
} from '@soc-soar/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchApi } from '../lib/api';
import { DataTable, type DataTableColumn } from './data-table';
import { StatusBadge, formatStatusVi } from './status-badge';

type AnalystReview = {
  reviewId: string;
  recommendationId: string;
  normalizedAlertId: string;
  alertId: string;
  pcapJobId?: string;
  selectedPlaybookId: string;
  severity?: string;
  confidence?: number;
  assetContext?: string;
  recommendedAction?: string;
  analystNote?: string;
  verdict: 'unknown' | 'true_positive' | 'false_positive';
  status: 'review' | 'approval' | 'changes_requested' | 'approved' | 'rejected';
  approvalId?: string;
  executionId?: string;
  auditLog: Array<{
    timestamp: string;
    actor: string;
    action: string;
    changes: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
};

type PcapPipeline = {
  file: PcapFile | null;
  job: PcapJob;
  rawAlert: RawAlert | null;
  normalizedAlert: NormalizedAlert | null;
  recommendation: Recommendation | null;
  explanation: RecommendationExplanation | null;
  review: AnalystReview | null;
  approval: ApprovalRequest | null;
  workflow: WorkflowExecution | null;
  incident: Incident | null;
  report: Report | null;
};

type UploadResponse = {
  file: PcapFile;
  job: PcapJob;
  pipeline: PcapPipeline;
};

type ReviewConfirmResponse = {
  review: AnalystReview;
  workflowExecution: WorkflowExecution;
  approvalRequest: ApprovalRequest | null;
};

type ReviewDecisionResponse = {
  review: AnalystReview;
  workflowExecution: WorkflowExecution;
  approvalRequest: ApprovalRequest;
};

type ReviewDraft = {
  severity: string;
  confidence: number;
  assetContext: string;
  selectedPlaybookId: string;
  recommendedAction: string;
  analystNote: string;
  verdict: string;
};

const pipelineSteps = [
  ['uploaded', 'PCAP Upload'],
  ['queued', 'PCAP Job Created'],
  ['parsing', 'PCAP Parsing / Feature Extraction'],
  ['alert_generated', 'Raw Alert Generated'],
  ['normalized', 'Chuẩn hóa cảnh báo'],
  ['recommended', 'Top-3 Recommendation'],
  ['ready_for_review', 'Analyst Review'],
  ['approval', 'Analyst Approval'],
  ['workflow', 'Thực thi workflow'],
  ['incident', 'Theo dõi sự cố'],
  ['report', 'Báo cáo'],
] as const;

export function PcapDemoPanel() {
  const [jobs, setJobs] = useState<PcapJob[]>([]);
  const [jobPage, setJobPage] = useState(1);
  const [jobLimit, setJobLimit] = useState(10);
  const [jobTotal, setJobTotal] = useState(0);
  const [pipeline, setPipeline] = useState<PcapPipeline | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const review = pipeline?.review ?? null;
  const recommendation = pipeline?.recommendation ?? null;
  const selectedCandidate = useMemo(
    () =>
      recommendation?.topPlaybooks.find(
        (candidate) => candidate.playbookId === review?.selectedPlaybookId,
      ) ?? recommendation?.topPlaybooks[0],
    [recommendation, review?.selectedPlaybookId],
  );
  const [reviewDraft, setReviewDraft] = useState({
    severity: '',
    confidence: 80,
    assetContext: '',
    selectedPlaybookId: '',
    recommendedAction: '',
    analystNote: '',
    verdict: 'unknown',
  });

  useEffect(() => {
    if (!review) {
      return;
    }

    setReviewDraft({
      severity: review.severity ?? pipeline?.normalizedAlert?.severity ?? 'medium',
      confidence: review.confidence ?? pipeline?.normalizedAlert?.confidence ?? 80,
      assetContext: review.assetContext ?? '',
      selectedPlaybookId: review.selectedPlaybookId,
      recommendedAction: review.recommendedAction ?? selectedCandidate?.matchedReasons[0] ?? '',
      analystNote: review.analystNote ?? '',
      verdict: review.verdict,
    });
  }, [pipeline?.normalizedAlert?.confidence, pipeline?.normalizedAlert?.severity, review, selectedCandidate]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchApi<PcapJob[], ApiCollectionMeta>(
        `/pcap/jobs?limit=${jobLimit}&page=${jobPage}`,
        { cache: 'no-store' },
      );
      setJobs(response.data);
      setJobTotal(response.meta?.total ?? response.data.length);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được PCAP jobs.');
    } finally {
      setLoading(false);
    }
  }, [jobLimit, jobPage]);

  useEffect(() => {
    loadJobs().catch(() => undefined);
  }, [loadJobs]);

  const loadPipeline = async (jobId: string) => {
    setSubmitting(`pipeline-${jobId}`);
    setError(null);

    try {
      const response = await fetchApi<PcapPipeline>(`/pcap/jobs/${jobId}/pipeline`, {
        cache: 'no-store',
      });
      setPipeline(response.data);
      setMessage(`Loaded pipeline for job ${jobId}.`);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không tải được pipeline.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Chọn file .pcap hoặc .pcapng trước khi upload.');
      return;
    }

    setSubmitting('upload');
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetchApi<UploadResponse>('/pcap/upload', {
        method: 'POST',
        body: formData,
      });

      setPipeline(response.data.pipeline);
      setSelectedFile(null);
      setMessage('PCAP uploaded. Pipeline is ready for Analyst Review.');
      await loadJobs();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Không upload được PCAP.');
    } finally {
      setSubmitting(null);
    }
  };

  const handleSample = async (scenario: string) => {
    setSubmitting(`sample-${scenario}`);
    setError(null);
    setMessage(null);

    try {
      const response = await fetchApi<UploadResponse>(`/pcap/sample/${scenario}`, {
        method: 'POST',
      });
      setPipeline(response.data.pipeline);
      setMessage('Sample PCAP processed. Pipeline is ready for Analyst Review.');
      await loadJobs();
    } catch (sampleError) {
      setError(sampleError instanceof Error ? sampleError.message : 'Không xử lý được sample PCAP.');
    } finally {
      setSubmitting(null);
    }
  };

  const updateReview = async () => {
    if (!review) {
      return;
    }

    setSubmitting('review-update');
    setError(null);

    try {
      await fetchApi<AnalystReview>(`/analyst-review/${review.recommendationId}/update`, {
        method: 'POST',
        body: JSON.stringify({
          ...reviewDraft,
          confidence: Number(reviewDraft.confidence),
          actor: 'soc-analyst',
        }),
      });
      await loadPipeline(review.pcapJobId ?? pipeline?.job.jobId ?? '');
      setMessage('Analyst Review updated and audit log recorded.');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Không lưu được Analyst Review.');
    } finally {
      setSubmitting(null);
    }
  };

  const confirmReview = async () => {
    if (!review) {
      return;
    }

    setSubmitting('review-confirm');
    setError(null);

    try {
      await fetchApi<ReviewConfirmResponse>(`/analyst-review/${review.recommendationId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({
          ...reviewDraft,
          confidence: Number(reviewDraft.confidence),
          actor: 'soc-analyst',
        }),
      });
      await loadPipeline(review.pcapJobId ?? pipeline?.job.jobId ?? '');
      setMessage('Review confirmed. Analyst Approval is now the active gate.');
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Không confirm được review.');
    } finally {
      setSubmitting(null);
    }
  };

  const decideApproval = async (decision: 'approve' | 'reject' | 'request-changes') => {
    if (!review) {
      return;
    }

    setSubmitting(`approval-${decision}`);
    setError(null);

    try {
      if (decision === 'request-changes') {
        await fetchApi<AnalystReview>(`/approval/${review.reviewId}/request-changes`, {
          method: 'POST',
          body: JSON.stringify({
            actor: 'soc-analyst',
            reason: 'Need review updates before execution.',
          }),
        });
      } else {
        await fetchApi<ReviewDecisionResponse>(`/approval/${review.reviewId}/${decision}`, {
          method: 'POST',
          body: JSON.stringify({
            decidedBy: 'soc-analyst',
            decisionReason:
              decision === 'approve'
                ? 'Approved after Analyst Review validation.'
                : 'Rejected after Analyst Approval validation.',
          }),
        });
      }
      await loadPipeline(review.pcapJobId ?? pipeline?.job.jobId ?? '');
      await loadJobs();
      setMessage(
        decision === 'approve'
          ? 'Approved. Workflow execution resumed and linked artifacts were updated.'
          : decision === 'reject'
            ? 'Rejected. Workflow execution stopped and incident/report were updated.'
            : 'Changes requested. Analyst Review reopened.',
      );
    } catch (approvalError) {
      setError(approvalError instanceof Error ? approvalError.message : 'Không cập nhật được approval.');
    } finally {
      setSubmitting(null);
    }
  };

  const onFileSelect = (file?: File) => {
    if (!file) {
      return;
    }

    const lower = file.name.toLowerCase();

    if (!lower.endsWith('.pcap') && !lower.endsWith('.pcapng')) {
      setError('Chỉ accept .pcap và .pcapng.');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const jobColumns: Array<DataTableColumn<PcapJob>> = [
    { key: 'jobId', header: 'Job ID', render: (job) => <span className="font-mono text-xs">{job.jobId}</span> },
    { key: 'fileId', header: 'File ID', render: (job) => <span className="font-mono text-xs">{job.fileId}</span> },
    { key: 'status', header: 'Status', render: (job) => <StatusBadge status={job.status} /> },
    { key: 'rawAlertId', header: 'Raw Alert', render: (job) => job.rawAlertId ? <span className="font-mono text-xs">{job.rawAlertId}</span> : <StatusBadge status="pending" /> },
    { key: 'recommendationId', header: 'Recommendation', render: (job) => job.recommendationId ? <span className="font-mono text-xs">{job.recommendationId}</span> : <StatusBadge status="not_generated" /> },
    { key: 'createdAt', header: 'Created time', render: (job) => new Date(job.createdAt).toLocaleString() },
    {
      key: 'action',
      header: 'Action',
      render: (job) => (
        <button
          className="text-teal-700 underline disabled:opacity-60"
          disabled={submitting === `pipeline-${job.jobId}`}
          onClick={() => loadPipeline(job.jobId)}
          type="button"
        >
          Open pipeline
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div
            className={`rounded-2xl border border-dashed p-6 transition ${
              dragActive
                ? 'border-[var(--accent)] bg-[rgba(122,162,247,0.14)]'
                : 'border-[var(--border)] bg-[var(--panel-muted)]'
            }`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              onFileSelect(event.dataTransfer.files[0]);
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
              PCAP Intake
            </p>
            <h3 className="mt-3 text-xl font-semibold">PCAP Upload</h3>
            <div className="mt-5 flex flex-wrap gap-3">
              <input
                accept=".pcap,.pcapng"
                className="hidden"
                onChange={(event) => onFileSelect(event.target.files?.[0])}
                ref={fileInputRef}
                type="file"
              />
              <button
                className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Choose file
              </button>
              <button
                className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!selectedFile || submitting === 'upload'}
                onClick={handleUpload}
                type="button"
              >
                {submitting === 'upload' ? 'Uploading...' : 'Upload PCAP'}
              </button>
            </div>
            {selectedFile ? (
              <div className="mt-5 grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 md:grid-cols-3">
                <Metric label="File name" value={selectedFile.name} />
                <Metric label="File size" value={formatBytes(selectedFile.size)} />
                <Metric label="Upload time" value={new Date().toLocaleString()} />
              </div>
            ) : (
              <p className="mt-5 text-sm text-slate-500">Drag and drop a .pcap/.pcapng file here.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-5">
            <h3 className="text-lg font-semibold">Load Sample Capture</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {RAW_ALERT_MOCK_SCENARIOS.map((scenario) => (
                <button
                  className="rounded-xl border border-teal-700 px-3 py-2 text-xs font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting !== null}
                  key={scenario}
                  onClick={() => handleSample(scenario)}
                  type="button"
                >
                  {submitting === `sample-${scenario}` ? 'Processing...' : scenario}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-800">{message}</p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-800">{error}</p>
        </section>
      ) : null}

      {pipeline ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">PCAP pipeline</h3>
              <p className="mt-1 text-sm text-slate-600">
                Job {pipeline.job.jobId} links PCAP input to alert, recommendation, review, approval,
                workflow, incident and report artifacts.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {pipeline.review ? (
                <a
                  className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800"
                  href="#analyst-review"
                >
                  Open Analyst Review
                </a>
              ) : null}
              <StatusBadge status={pipeline.job.status} />
            </div>
          </div>
          <PcapPipelineStepper pipeline={pipeline} />
          <ArtifactCards pipeline={pipeline} />
        </section>
      ) : null}

      {pipeline?.review ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <AnalystReviewPanel
            disabled={pipeline.review.status !== 'review' && pipeline.review.status !== 'changes_requested'}
            draft={reviewDraft}
            onChange={setReviewDraft}
            onConfirm={confirmReview}
            onSave={updateReview}
            pipeline={pipeline}
            submitting={submitting}
          />
          <AnalystApprovalPanel
            onDecision={decideApproval}
            pipeline={pipeline}
            submitting={submitting}
          />
        </section>
      ) : null}

      {pipeline?.workflow ? <WorkflowExecutionPanel pipeline={pipeline} /> : null}

      <DataTable
        actions={
          <button
            className="rounded-lg border border-teal-700 px-3 py-1 text-sm font-semibold text-teal-800"
            onClick={() => loadJobs()}
            type="button"
          >
            Refresh
          </button>
        }
        columns={jobColumns}
        data={jobs}
        emptyMessage="No PCAP intake jobs found."
        error={error && jobs.length === 0 ? error : null}
        getRowKey={(job) => job.jobId}
        limit={jobLimit}
        loading={loading}
        onLimitChange={(nextLimit) => { setJobPage(1); setJobLimit(nextLimit); }}
        onPageChange={setJobPage}
        page={jobPage}
        title="PCAP Jobs"
        total={jobTotal}
      />
    </div>
  );
}

function PcapPipelineStepper({ pipeline }: { pipeline: PcapPipeline }) {
  const activeStatuses = new Set(pipeline.job.pipelineEvents?.map((event) => event.status) ?? []);

  if (pipeline.approval) activeStatuses.add('approval');
  if (pipeline.workflow) activeStatuses.add('workflow');
  if (pipeline.incident) activeStatuses.add('incident');
  if (pipeline.report) activeStatuses.add('report');

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {pipelineSteps.map(([key, label], index) => (
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4"
          key={key}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--panel)] text-xs font-semibold text-teal-700">
              {index + 1}
            </span>
            <StatusBadge status={activeStatuses.has(key) ? 'completed' : 'pending'} />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">
            {pipeline.job.pipelineEvents?.find((event) => event.status === key)?.message ??
              'Not started'}
          </p>
        </div>
      ))}
    </div>
  );
}

function ArtifactCards({ pipeline }: { pipeline: PcapPipeline }) {
  const cards = [
    ['Uploaded file', pipeline.file?.originalName, pipeline.file ? null : undefined],
    ['Raw Alert', pipeline.rawAlert?.alertId, pipeline.rawAlert ? `/alerts/${pipeline.rawAlert.alertId}` : undefined],
    [
      'Normalized Alert',
      pipeline.normalizedAlert?.normalizedAlertId,
      pipeline.normalizedAlert ? `/normalized-alerts` : undefined,
    ],
    [
      'Khuyến nghị playbook',
      pipeline.recommendation?.recommendationId,
      pipeline.recommendation ? `/recommendations/${pipeline.recommendation.recommendationId}` : undefined,
    ],
    [
      'Giải thích khuyến nghị',
      pipeline.explanation?.explanationId,
      pipeline.explanation ? `/explanations/${pipeline.explanation.explanationId}` : undefined,
    ],
    ['Analyst Review', pipeline.review?.reviewId, undefined],
    [
      'Analyst Approval',
      pipeline.approval?.approvalId,
      pipeline.approval ? `/approvals/${pipeline.approval.approvalId}` : undefined,
    ],
    [
      'Thực thi workflow',
      pipeline.workflow?.executionId,
      pipeline.workflow ? `/workflows/${pipeline.workflow.executionId}` : undefined,
    ],
    [
      'Theo dõi sự cố',
      pipeline.incident?.incidentId,
      pipeline.incident ? `/incidents/${pipeline.incident.incidentId}` : undefined,
    ],
    ['Báo cáo', pipeline.report?.reportId, pipeline.report ? `/reports` : undefined],
  ];

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {cards.map(([label, value, href]) => (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4" key={label}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          {href ? (
            <Link className="mt-2 block break-words text-sm font-semibold text-teal-700 underline" href={href}>
              {value ?? 'Pending'}
            </Link>
          ) : (
            <p className="mt-2 break-words text-sm font-semibold text-slate-900">{value ?? 'Pending'}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function AnalystReviewPanel({
  pipeline,
  draft,
  disabled,
  submitting,
  onChange,
  onSave,
  onConfirm,
}: {
  pipeline: PcapPipeline;
  draft: ReviewDraft;
  disabled: boolean;
  submitting: string | null;
  onChange: (draft: ReviewDraft) => void;
  onSave: () => void;
  onConfirm: () => void;
}) {
  const candidates = pipeline.recommendation?.topPlaybooks ?? [];

  return (
    <section
      className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
      id="analyst-review"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Analyst Review</h3>
          <p className="mt-1 text-sm text-slate-600">
            Review and adjust the recommendation before Analyst Approval.
          </p>
        </div>
        <StatusBadge status={pipeline.review?.status ?? null} />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Alert severity">
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, severity: event.target.value })}
            value={draft.severity}
          >
            {['low', 'medium', 'high', 'critical'].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </Field>
        <Field label="Confidence">
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            max={100}
            min={0}
            onChange={(event) => onChange({ ...draft, confidence: Number(event.target.value) })}
            type="number"
            value={draft.confidence}
          />
        </Field>
        <Field label="Asset context">
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, assetContext: event.target.value })}
            value={draft.assetContext}
          />
        </Field>
        <Field label="Selected playbook">
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, selectedPlaybookId: event.target.value })}
            value={draft.selectedPlaybookId}
          >
            {candidates.map((candidate) => (
              <option key={candidate.playbookId} value={candidate.playbookId}>
                {candidate.playbookId} - {candidate.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Recommended containment/action">
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, recommendedAction: event.target.value })}
            value={draft.recommendedAction}
          />
        </Field>
        <Field label="Analyst decision">
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, verdict: event.target.value })}
            value={draft.verdict}
          >
            <option value="unknown">Unknown</option>
            <option value="true_positive">True positive</option>
            <option value="false_positive">False positive</option>
          </select>
        </Field>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Analyst note</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm"
            disabled={disabled}
            onChange={(event) => onChange({ ...draft, analystNote: event.target.value })}
            value={draft.analystNote}
          />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:opacity-60"
          disabled={disabled || submitting === 'review-update'}
          onClick={onSave}
          type="button"
        >
          {submitting === 'review-update' ? 'Saving...' : 'Save review edits'}
        </button>
        <button
          className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={disabled || submitting === 'review-confirm'}
          onClick={onConfirm}
          type="button"
        >
          {submitting === 'review-confirm' ? 'Confirming...' : 'Confirm Review'}
        </button>
      </div>
      <AuditLog review={pipeline.review} />
    </section>
  );
}

function AnalystApprovalPanel({
  pipeline,
  submitting,
  onDecision,
}: {
  pipeline: PcapPipeline;
  submitting: string | null;
  onDecision: (decision: 'approve' | 'reject' | 'request-changes') => void;
}) {
  const review = pipeline.review;
  const approvalReady = review?.status === 'approval' && pipeline.approval?.status === 'pending';
  const selected = pipeline.recommendation?.topPlaybooks.find(
    (candidate) => candidate.playbookId === review?.selectedPlaybookId,
  );

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Analyst Approval</h3>
          <p className="mt-1 text-sm text-slate-600">Final gate before sensitive workflow actions execute.</p>
        </div>
        <StatusBadge status={pipeline.approval?.status ?? review?.status ?? 'pending'} />
      </div>
      <div className="mt-5 space-y-3">
        <SummaryRow label="Alert" value={pipeline.rawAlert?.title ?? 'Pending'} />
        <SummaryRow label="Normalized fields" value={`${pipeline.normalizedAlert?.alertType ?? 'Pending'} / ${pipeline.normalizedAlert?.severity ?? 'Pending'}`} />
        <SummaryRow label="Selected playbook" value={review?.selectedPlaybookId ?? 'Pending'} />
        <SummaryRow label="Recommendation score" value={String(selected?.finalScore ?? selected?.totalScore ?? 'Pending')} />
        <SummaryRow label="Decision rationale" value={pipeline.explanation?.summary ?? 'Not generated'} />
        <SummaryRow label="Actions requiring approval" value={pipeline.workflow?.steps.filter((step) => step.approvalRequired).map((step) => step.action).join(', ') || pipeline.approval?.action || 'Waiting for review confirmation'} />
        <SummaryRow label="Analyst edits" value={`${review?.verdict ?? 'unknown'} | ${review?.analystNote || 'No note'}`} />
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!approvalReady || submitting === 'approval-approve'}
          onClick={() => onDecision('approve')}
          type="button"
        >
          {submitting === 'approval-approve' ? 'Approving...' : 'Approve and Execute'}
        </button>
        <button
          className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-800 disabled:opacity-60"
          disabled={!approvalReady || submitting === 'approval-reject'}
          onClick={() => onDecision('reject')}
          type="button"
        >
          Reject
        </button>
        <button
          className="rounded-xl border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-60"
          disabled={!review || submitting === 'approval-request-changes'}
          onClick={() => onDecision('request-changes')}
          type="button"
        >
          Request Changes / Back to Review
        </button>
      </div>
    </section>
  );
}

function WorkflowExecutionPanel({ pipeline }: { pipeline: PcapPipeline }) {
  const workflow = pipeline.workflow;

  if (!workflow) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Thực thi workflow</h3>
          <p className="mt-1 text-sm text-slate-600">Playbook execution timeline and per-step status.</p>
        </div>
        <StatusBadge status={workflow.status} />
      </div>
      <div className="mt-5 space-y-3">
        {workflow.steps.map((step) => (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4" key={step.step}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Step {step.step}: {step.action}
                </p>
                <p className="mt-1 text-xs text-slate-500">{step.description}</p>
              </div>
              <StatusBadge status={step.status === 'success' ? 'completed' : step.status} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-4">
              <Metric label="startedAt" value={step.startedAt ? new Date(step.startedAt).toLocaleString() : 'pending'} />
              <Metric label="completedAt" value={step.finishedAt ? new Date(step.finishedAt).toLocaleString() : 'pending'} />
              <Metric label="approval" value={formatStatusVi(step.approvalStatus)} />
              <Metric label="output" value={step.result ?? 'Waiting for execution'} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditLog({ review }: { review: AnalystReview | null }) {
  if (!review?.auditLog.length) {
    return null;
  }

  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-4">
      <p className="text-sm font-semibold text-slate-900">Review audit log</p>
      <div className="mt-3 space-y-2">
        {review.auditLog.map((entry, index) => (
          <p className="text-xs leading-5 text-slate-500" key={`${entry.timestamp}-${index}`}>
            {new Date(entry.timestamp).toLocaleString()} - {entry.actor} - {entry.action}
          </p>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
