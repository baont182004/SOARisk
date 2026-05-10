'use client';

import type {
  ApprovalRequest,
  Incident,
  NormalizedAlert,
  RawAlert,
  Recommendation,
  RecommendationExplanation,
  Report,
  WorkflowExecution,
} from '@soc-soar/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { fetchApi } from '../lib/api';
import { StatusBadge, formatStatusVi } from './status-badge';

const demoScenarios = [
  { id: 'port-scan', label: 'Port scan reconnaissance' },
  { id: 'icmp-flood', label: 'ICMP flood / DoS' },
  { id: 'sql-injection', label: 'SQL injection' },
  { id: 'xss', label: 'Cross-site scripting' },
  { id: 'suspicious-dns', label: 'Suspicious DNS activity' },
  { id: 'botnet-c2', label: 'Botnet / C2 beacon' },
];

type DemoStep = {
  key: string;
  label: string;
  status: 'completed' | 'waiting_approval' | 'failed';
  ref?: string;
  message?: string;
};

type DemoRunResult = {
  scenario: string;
  alertId?: string | undefined;
  normalizedAlertId?: string | undefined;
  recommendationId?: string | undefined;
  selectedPlaybookId?: string | undefined;
  explanationId?: string | undefined;
  executionId?: string | undefined;
  pendingApprovalId?: string | undefined;
  workflowStatus?: string | undefined;
  steps: DemoStep[];
};

type ApprovalDecisionResponse = {
  approvalRequest: ApprovalRequest;
  workflowExecution: WorkflowExecution;
};

type DemoArtifacts = {
  alert?: RawAlert | undefined;
  normalizedAlert?: NormalizedAlert | undefined;
  recommendation?: Recommendation | undefined;
  explanation?: RecommendationExplanation | undefined;
  workflow?: WorkflowExecution | undefined;
  approval?: ApprovalRequest | undefined;
  incident?: Incident | undefined;
  report?: Report | undefined;
};

type PipelineStepView = {
  number: number;
  title: string;
  description: string;
  status: string;
  timestamp?: string | undefined;
  links?: Array<{ label: string; href: string }> | undefined;
  details: ReactNode;
};

type DecisionOutcome = 'approved' | 'rejected' | null;

const defaultDecisionReason =
  'Reviewed alert context, recommendation evidence, and expected response impact.';

export function DemoWizard() {
  const [scenario, setScenario] = useState('port-scan');
  const [result, setResult] = useState<DemoRunResult | null>(null);
  const [artifacts, setArtifacts] = useState<DemoArtifacts>({});
  const [decisionOutcome, setDecisionOutcome] = useState<DecisionOutcome>(null);
  const [decidedBy, setDecidedBy] = useState('soc-analyst');
  const [decisionReason, setDecisionReason] = useState(defaultDecisionReason);
  const [loading, setLoading] = useState(false);
  const [deciding, setDeciding] = useState<DecisionOutcome>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedCandidate = useMemo(() => {
    const selectedPlaybookId = result?.selectedPlaybookId ?? artifacts.workflow?.playbookId;

    return artifacts.recommendation?.topPlaybooks.find(
      (playbook) => playbook.playbookId === selectedPlaybookId,
    );
  }, [artifacts.recommendation, artifacts.workflow?.playbookId, result?.selectedPlaybookId]);

  const workflowState = getWorkflowState({
    loading,
    deciding,
    outcome: decisionOutcome,
    status: artifacts.workflow?.status ?? result?.workflowStatus,
    pendingApprovalId: result?.pendingApprovalId,
  });

  const runDemo = async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    setResult(null);
    setArtifacts({});
    setDecisionOutcome(null);
    setDecisionReason(defaultDecisionReason);

    try {
      const response = await fetchApi<DemoRunResult>(`/demo/run/${scenario}`, {
        method: 'POST',
      });
      const nextResult = response.data;
      const nextArtifacts = await loadDemoArtifacts(nextResult);

      setResult(nextResult);
      setArtifacts(nextArtifacts);
      setNotice('SOAR execution pipeline is ready for analyst review.');
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Không thể khởi chạy SOAR pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const resetRun = () => {
    setResult(null);
    setArtifacts({});
    setDecisionOutcome(null);
    setDecisionReason(defaultDecisionReason);
    setError(null);
    setNotice(null);
  };

  const handleScenarioChange = (nextScenario: string) => {
    setScenario(nextScenario);
    resetRun();
  };

  const decide = async (decision: Exclude<DecisionOutcome, null>) => {
    if (!result?.pendingApprovalId) {
      return;
    }

    setDeciding(decision);
    setError(null);
    setNotice(null);

    try {
      const response = await fetchApi<ApprovalDecisionResponse>(
        `/approvals/${result.pendingApprovalId}/${decision === 'approved' ? 'approve' : 'reject'}`,
        {
          method: 'POST',
          body: JSON.stringify({
            decidedBy,
            decisionReason,
          }),
        },
      );
      const terminalArtifacts = await loadTerminalArtifacts(response.data.workflowExecution.executionId);

      setDecisionOutcome(decision);
      setResult({
        ...result,
        pendingApprovalId: undefined,
        workflowStatus: response.data.workflowExecution.status,
      });
      setArtifacts((current) => ({
        ...current,
        ...terminalArtifacts,
        approval: response.data.approvalRequest,
        workflow: response.data.workflowExecution,
      }));
      setNotice(
        decision === 'approved'
          ? 'Approval recorded. Response workflow has resumed and all linked artifacts were updated.'
          : 'Decision recorded. Response workflow was stopped and linked artifacts were updated.',
      );
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : 'Không thể ghi nhận quyết định phê duyệt.',
      );
    } finally {
      setDeciding(null);
    }
  };

  const pipelineSteps = buildPipelineSteps({
    loading,
    result,
    artifacts,
    selectedCandidate,
    decisionOutcome,
    deciding,
    onApprove: () => decide('approved'),
    onReject: () => decide('rejected'),
    decidedBy,
    setDecidedBy,
    decisionReason,
    setDecisionReason,
  });

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Scenario</span>
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2 text-sm text-slate-800"
                disabled={loading || deciding !== null}
                onChange={(event) => handleScenarioChange(event.target.value)}
                value={scenario}
              >
                {demoScenarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <Metric label="Workflow state" value={workflowState.label} status={workflowState.status} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || deciding !== null}
              onClick={runDemo}
              type="button"
            >
              {loading ? 'Running pipeline...' : 'Run SOAR Pipeline'}
            </button>
            <button
              className="rounded-xl border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || deciding !== null || (!result && Object.keys(artifacts).length === 0)}
              onClick={resetRun}
              type="button"
            >
              Reset run
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
          <p className="text-sm text-rose-800">{productizeText(error)}</p>
        </section>
      ) : null}

      {notice ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm text-emerald-800">{notice}</p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">
              SOAR Execution Pipeline
            </p>
            <h3 className="mt-2 text-xl font-semibold">Alert to response workflow</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              The run tracks each operational stage from alert ingestion through recommendation,
              approval, response execution, incident update, and report generation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {getStateMachine(workflowState.key).map((state) => (
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  state.active
                    ? 'border-[rgba(122,162,247,0.45)] bg-[rgba(122,162,247,0.16)] text-[var(--accent)]'
                    : 'border-[var(--border)] bg-[var(--panel-muted)] text-slate-500'
                }`}
                key={state.key}
              >
                {state.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pipelineSteps.map((step) => (
            <PipelineStepCard key={step.number} step={step} />
          ))}
        </div>
      </section>

      {isTerminalWorkflow(artifacts.workflow?.status) || decisionOutcome ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">Generated artifacts</h3>
              <p className="mt-1 text-sm text-slate-600">
                Review the records produced by this response workflow.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              {artifactLinks(result, artifacts).map((link) => (
                <Link
                  className="rounded-xl border border-teal-700 px-4 py-2 font-semibold text-teal-800"
                  href={link.href}
                  key={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

async function loadDemoArtifacts(result: DemoRunResult): Promise<DemoArtifacts> {
  const [alert, normalizedAlert, recommendation, explanation, workflow, approval] = await Promise.all([
    result.alertId ? fetchApi<RawAlert>(`/alerts/${result.alertId}`, { cache: 'no-store' }) : null,
    result.normalizedAlertId
      ? fetchApi<NormalizedAlert>(`/normalized-alerts/${result.normalizedAlertId}`, {
          cache: 'no-store',
        })
      : null,
    result.recommendationId
      ? fetchApi<Recommendation>(`/recommendations/${result.recommendationId}`, {
          cache: 'no-store',
        })
      : null,
    result.explanationId
      ? fetchApi<RecommendationExplanation>(`/explanations/${result.explanationId}`, {
          cache: 'no-store',
        })
      : null,
    result.executionId
      ? fetchApi<WorkflowExecution>(`/workflows/${result.executionId}`, {
          cache: 'no-store',
        })
      : null,
    result.pendingApprovalId
      ? fetchApi<ApprovalRequest>(`/approvals/${result.pendingApprovalId}`, {
          cache: 'no-store',
        })
      : null,
  ]);

  const terminalArtifacts = result.executionId
    ? await loadTerminalArtifacts(result.executionId)
    : {};

  return {
    alert: alert?.data,
    normalizedAlert: normalizedAlert?.data,
    recommendation: recommendation?.data,
    explanation: explanation?.data,
    workflow: workflow?.data,
    approval: approval?.data,
    ...terminalArtifacts,
  };
}

async function loadTerminalArtifacts(executionId: string): Promise<Pick<DemoArtifacts, 'incident' | 'report'>> {
  const [incidentsResponse, reportsResponse] = await Promise.all([
    fetchApi<Incident[]>('/incidents', { cache: 'no-store' }),
    fetchApi<Report[]>('/reports', { cache: 'no-store' }),
  ]);

  return {
    incident: incidentsResponse.data.find((incident) => incident.executionId === executionId),
    report: reportsResponse.data.find((report) => report.executionId === executionId),
  };
}

function buildPipelineSteps(input: {
  loading: boolean;
  result: DemoRunResult | null;
  artifacts: DemoArtifacts;
  selectedCandidate?: Recommendation['topPlaybooks'][number] | undefined;
  decisionOutcome: DecisionOutcome;
  deciding: DecisionOutcome;
  onApprove: () => void;
  onReject: () => void;
  decidedBy: string;
  setDecidedBy: (value: string) => void;
  decisionReason: string;
  setDecisionReason: (value: string) => void;
}): PipelineStepView[] {
  const {
    loading,
    result,
    artifacts,
    selectedCandidate,
    decisionOutcome,
    deciding,
    onApprove,
    onReject,
    decidedBy,
    setDecidedBy,
    decisionReason,
    setDecisionReason,
  } = input;
  const pendingApproval = result?.pendingApprovalId ? artifacts.approval : undefined;
  const workflowTerminal = isTerminalWorkflow(artifacts.workflow?.status);
  const rejected = decisionOutcome === 'rejected' || artifacts.workflow?.status === 'cancelled';
  const responseStatus = rejected
    ? 'skipped'
    : workflowTerminal
      ? artifacts.workflow?.status === 'success'
        ? 'completed'
        : 'failed'
      : pendingApproval
        ? 'pending'
        : loading
          ? 'running'
          : 'not_started';

  return [
    {
      number: 1,
      title: 'Ingest Alert',
      description: 'Create or update the alert intake record.',
      status: statusFor(loading, Boolean(artifacts.alert)),
      timestamp: artifacts.alert?.createdAt,
      links: result?.alertId ? [{ label: 'Alert', href: `/alerts/${result.alertId}` }] : [],
      details: artifacts.alert ? (
        <DetailGrid
          items={[
            ['Alert ID', artifacts.alert.alertId],
            ['Source', artifacts.alert.source],
            ['Severity', artifacts.alert.severity ?? 'unassigned'],
            ['Timestamp', formatDate(artifacts.alert.observedAt ?? artifacts.alert.createdAt)],
            ['Asset / user', artifacts.alert.assetId ?? artifacts.alert.hostname ?? artifacts.alert.username ?? 'Pending'],
            ['Title', artifacts.alert.title],
          ]}
        />
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 2,
      title: 'Normalize Alert',
      description: 'Transform source-specific fields into the canonical SOAR alert schema.',
      status: statusFor(loading && Boolean(artifacts.alert), Boolean(artifacts.normalizedAlert)),
      timestamp: artifacts.normalizedAlert?.createdAt,
      links: result?.normalizedAlertId
        ? [{ label: 'Normalized alert', href: `/normalized-alerts/${result.normalizedAlertId}` }]
        : [],
      details: artifacts.normalizedAlert ? (
        <div className="grid gap-3 md:grid-cols-2">
          <DetailGrid
            title="Source fields"
            items={[
              ['sourceIp', artifacts.alert?.sourceIp ?? 'Pending'],
              ['targetIp', artifacts.alert?.targetIp ?? 'Pending'],
              ['protocol', artifacts.alert?.protocol ?? 'Pending'],
              ['username', artifacts.alert?.username ?? 'Pending'],
            ]}
          />
          <DetailGrid
            title="Normalized fields"
            items={[
              ['alertType', artifacts.normalizedAlert.alertType],
              ['severity', artifacts.normalizedAlert.severity],
              ['confidence', String(artifacts.normalizedAlert.confidence)],
              ['status', formatStatusVi(artifacts.normalizedAlert.normalizationStatus)],
            ]}
          />
        </div>
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 3,
      title: 'Match Playbook Candidates',
      description: 'Score playbook candidates and expose match evidence for analyst review.',
      status: statusFor(loading && Boolean(artifacts.normalizedAlert), Boolean(artifacts.recommendation)),
      timestamp: artifacts.recommendation?.createdAt,
      links: result?.recommendationId
        ? [{ label: 'Recommendation', href: `/recommendations/${result.recommendationId}` }]
        : [],
      details: artifacts.recommendation ? (
        <CandidateTable candidates={artifacts.recommendation.topPlaybooks.slice(0, 3)} />
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 4,
      title: 'Select Recommended Playbook',
      description: 'Selected response playbook for workflow creation.',
      status: statusFor(loading && Boolean(artifacts.recommendation), Boolean(selectedCandidate)),
      timestamp: artifacts.recommendation?.updatedAt ?? artifacts.recommendation?.createdAt,
      links: selectedCandidate
        ? [{ label: selectedCandidate.playbookId, href: `/playbooks/${selectedCandidate.playbookId}` }]
        : [],
      details: selectedCandidate ? (
        <DetailGrid
          items={[
            ['Selected playbook', `${selectedCandidate.playbookId} ${selectedCandidate.name}`],
            ['Score', String(selectedCandidate.finalScore ?? selectedCandidate.totalScore)],
            ['Confidence', selectedCandidate.confidenceBand ?? 'Pending'],
            ['Reason', selectedCandidate.matchedReasons[0] ?? selectedCandidate.explanation ?? 'Best operational fit.'],
          ]}
        />
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 5,
      title: 'Explain Recommendation',
      description: 'Provide concise decision support before execution begins.',
      status: statusFor(loading && Boolean(selectedCandidate), Boolean(artifacts.explanation)),
      timestamp: artifacts.explanation?.createdAt,
      links: result?.explanationId
        ? [{ label: 'Explanation', href: `/explanations/${result.explanationId}` }]
        : [],
      details: artifacts.explanation || selectedCandidate ? (
        <ExplanationPanel explanation={artifacts.explanation} selectedCandidate={selectedCandidate} />
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 6,
      title: 'Create Workflow',
      description: 'Instantiate the response workflow and open linked case tracking.',
      status: statusFor(loading && Boolean(artifacts.explanation), Boolean(artifacts.workflow)),
      timestamp: artifacts.workflow?.createdAt,
      links: result?.executionId ? [{ label: 'Workflow', href: `/workflows/${result.executionId}` }] : [],
      details: artifacts.workflow ? (
        <DetailGrid
          items={[
            ['Workflow ID', artifacts.workflow.executionId],
            ['Status', formatStatusVi(artifacts.workflow.status)],
            ['Current step', String(artifacts.workflow.currentStep)],
            ['Owner', 'SOC automation'],
            ['Created time', formatDate(artifacts.workflow.createdAt)],
            ['Playbook', artifacts.workflow.playbookId],
          ]}
        />
      ) : (
        <Placeholder text="Not started" />
      ),
    },
    {
      number: 7,
      title: 'Analyst Approval Gate',
      description: 'Pause for an explicit analyst decision before sensitive response execution.',
      status: pendingApproval
        ? 'waiting_approval'
        : decisionOutcome === 'approved'
          ? 'approved'
          : decisionOutcome === 'rejected'
            ? 'rejected'
            : statusFor(loading && Boolean(artifacts.workflow), false),
      timestamp: pendingApproval?.requestedAt ?? artifacts.approval?.decidedAt,
      links: artifacts.approval ? [{ label: 'Approval', href: `/approvals/${artifacts.approval.approvalId}` }] : [],
      details: (
        <ApprovalGate
          approval={artifacts.approval}
          deciding={deciding}
          disabled={!pendingApproval || deciding !== null}
          onApprove={onApprove}
          onReject={onReject}
          playbookLabel={
            selectedCandidate
              ? `${selectedCandidate.playbookId} ${selectedCandidate.name}`
              : artifacts.workflow?.playbookId
          }
          decidedBy={decidedBy}
          setDecidedBy={setDecidedBy}
          decisionReason={decisionReason}
          setDecisionReason={setDecisionReason}
          actionDescription={
            artifacts.workflow?.steps.find((step) => step.step === artifacts.approval?.step)
              ?.description
          }
        />
      ),
    },
    {
      number: 8,
      title: 'Execute Response Actions',
      description: 'Run the playbook tasks and record each action status.',
      status: responseStatus,
      timestamp: artifacts.workflow?.finishedAt ?? artifacts.workflow?.updatedAt,
      links: result?.executionId ? [{ label: 'Workflow tasks', href: `/workflows/${result.executionId}` }] : [],
      details: artifacts.workflow ? (
        <WorkflowTaskList workflow={artifacts.workflow} />
      ) : (
        <Placeholder text="Response tasks will be listed after workflow creation." />
      ),
    },
    {
      number: 9,
      title: 'Incident Update',
      description: 'Create or update the incident record linked to the alert and workflow.',
      status: artifacts.incident && (workflowTerminal || decisionOutcome) ? 'completed' : responseStatus,
      timestamp: artifacts.incident?.updatedAt,
      links: artifacts.incident ? [{ label: 'Incident', href: `/incidents/${artifacts.incident.incidentId}` }] : [],
      details: artifacts.incident ? (
        <DetailGrid
          items={[
            ['Incident ID', artifacts.incident.incidentId],
            ['Severity', artifacts.incident.severity],
            ['Status', formatStatusVi(artifacts.incident.status)],
            ['Assigned analyst', 'SOC L1 queue'],
            ['Linked alert', artifacts.incident.alertId ?? artifacts.incident.normalizedAlertId],
            ['Linked workflow', artifacts.incident.executionId ?? 'Pending'],
          ]}
        />
      ) : (
        <Placeholder text="Incident record will be linked after the workflow reaches a decision point." />
      ),
    },
    {
      number: 10,
      title: 'Report & Dashboard Update',
      description: 'Generate the response summary and refresh operational views.',
      status: artifacts.report ? 'completed' : responseStatus,
      timestamp: artifacts.report?.createdAt,
      links: artifacts.report ? [{ label: 'Report', href: `/reports/${artifacts.report.reportId}` }] : [],
      details: artifacts.report ? (
        <DetailGrid
          items={[
            ['Report ID', artifacts.report.reportId],
            ['Report generated', 'Yes'],
            ['Dashboard updated', 'Yes'],
            ['Final outcome', formatStatusVi(artifacts.report.finalStatus)],
            ['Execution summary', productizeText(artifacts.report.executionSummary)],
          ]}
        />
      ) : (
        <Placeholder text="Final report and dashboard state will be available after the workflow ends." />
      ),
    },
  ];
}

function PipelineStepCard({ step }: { step: PipelineStepView }) {
  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--panel-muted)] p-4" open={step.status !== 'not_started'}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(122,162,247,0.45)] bg-[rgba(122,162,247,0.16)] text-sm font-semibold text-[var(--accent)]">
            {step.number}
          </span>
          <div className="min-w-0">
            <h4 className="font-semibold text-slate-900">{step.title}</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">{step.description}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {step.links?.map((link) => (
                <Link className="text-xs font-semibold text-teal-700 underline" href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {step.timestamp ? (
            <span className="text-xs text-slate-500">{formatDate(step.timestamp)}</span>
          ) : null}
          <StatusBadge status={step.status} />
        </div>
      </summary>
      <div className="mt-4 border-t border-[var(--border)] pt-4">{step.details}</div>
    </details>
  );
}

function ApprovalGate({
  approval,
  deciding,
  disabled,
  onApprove,
  onReject,
  playbookLabel,
  decidedBy,
  setDecidedBy,
  decisionReason,
  setDecisionReason,
  actionDescription,
}: {
  approval?: ApprovalRequest | undefined;
  deciding: DecisionOutcome;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  playbookLabel?: string | undefined;
  decidedBy: string;
  setDecidedBy: (value: string) => void;
  decisionReason: string;
  setDecisionReason: (value: string) => void;
  actionDescription?: string | undefined;
}) {
  if (!approval) {
    return <Placeholder text="Not started" />;
  }

  const decisionRecorded = approval.status !== 'pending';

  return (
    <div className="space-y-4">
      <DetailGrid
        items={[
          ['Action awaiting approval', approval.action],
          ['Proposed playbook', playbookLabel ?? 'Pending'],
          ['Risk level', approval.risk],
          ['Expected impact', productizeText(actionDescription ?? 'Response action will update the linked workflow and incident records.')],
          ['Approver', approval.decidedBy ?? decidedBy],
          ['Decision status', formatStatusVi(approval.status)],
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Approver</span>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-slate-800 disabled:opacity-70"
            disabled={decisionRecorded}
            onChange={(event) => setDecidedBy(event.target.value)}
            value={approval.decidedBy ?? decidedBy}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Decision reason</span>
          <textarea
            className="min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm text-slate-800 disabled:opacity-70"
            disabled={decisionRecorded}
            onChange={(event) => setDecisionReason(event.target.value)}
            value={approval.decisionReason ?? decisionReason}
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || decisionRecorded}
          onClick={onApprove}
          type="button"
        >
          {deciding === 'approved' ? 'Approving...' : 'Approve response workflow'}
        </button>
        <button
          className="rounded-xl border border-rose-700 px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={disabled || decisionRecorded}
          onClick={onReject}
          type="button"
        >
          {deciding === 'rejected' ? 'Rejecting...' : 'Reject response workflow'}
        </button>
      </div>
    </div>
  );
}

function CandidateTable({ candidates }: { candidates: Recommendation['topPlaybooks'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-slate-500">
            <th className="px-3 py-3 font-semibold">Rank</th>
            <th className="px-3 py-3 font-semibold">Playbook</th>
            <th className="px-3 py-3 font-semibold">Score</th>
            <th className="px-3 py-3 font-semibold">Confidence</th>
            <th className="px-3 py-3 font-semibold">Matched criteria</th>
            <th className="px-3 py-3 font-semibold">Missing criteria</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr className="border-b border-[var(--border)] last:border-b-0" key={candidate.playbookId}>
              <td className="px-3 py-3">{candidate.rank}</td>
              <td className="px-3 py-3">
                <Link className="font-semibold text-teal-700 underline" href={`/playbooks/${candidate.playbookId}`}>
                  {candidate.playbookId}
                </Link>
                <p className="mt-1 text-xs text-slate-500">{candidate.name}</p>
              </td>
              <td className="px-3 py-3">{candidate.finalScore ?? candidate.totalScore}</td>
              <td className="px-3 py-3">{candidate.confidenceBand ?? 'Pending'}</td>
              <td className="px-3 py-3">{(candidate.matchedCriteria ?? candidate.matchedReasons).slice(0, 3).join(', ')}</td>
              <td className="px-3 py-3">{(candidate.missingCriteria ?? candidate.missingFields).slice(0, 3).join(', ') || 'None'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExplanationPanel({
  explanation,
  selectedCandidate,
}: {
  explanation?: RecommendationExplanation | undefined;
  selectedCandidate?: Recommendation['topPlaybooks'][number] | undefined;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <InfoPanel
        title="Why this playbook"
        text={productizeText(explanation?.summary ?? selectedCandidate?.explanation ?? selectedCandidate?.matchedReasons[0] ?? 'Strongest match across alert type, severity, and available context.')}
      />
      <InfoPanel
        title="Risk factors"
        text={[
          selectedCandidate?.approvalRisk ? `Approval risk: ${selectedCandidate.approvalRisk}` : undefined,
          selectedCandidate?.missingCriteria?.length
            ? `Watchlist: ${selectedCandidate.missingCriteria.slice(0, 3).join(', ')}`
            : 'No major scoring gaps in the top recommendation.',
        ]
          .filter(Boolean)
          .join(' ')}
      />
      <InfoPanel
        title="Required approval"
        text={selectedCandidate?.approvalRequired ? 'Analyst approval is required before reviewed response tasks continue.' : 'No analyst approval requirement was identified.'}
      />
      <InfoPanel
        title="Expected outcome"
        text={productizeText(selectedCandidate?.matchedReasons[1] ?? 'Incident context, workflow tasks, and response reporting are updated together.')}
      />
    </div>
  );
}

function WorkflowTaskList({ workflow }: { workflow: WorkflowExecution }) {
  const curatedNames = ['Enrich indicator', 'Create incident', 'Notify analyst', 'Update case status', 'Generate report'];

  return (
    <div className="space-y-3">
      {workflow.steps.map((step, index) => (
        <div
          className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 md:grid-cols-[1fr_auto]"
          key={`${workflow.executionId}-${step.step}`}
        >
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {curatedNames[index] ?? humanizeAction(step.action)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{productizeText(step.description)}</p>
          </div>
          <StatusBadge status={normalizeTaskStatus(step.status)} />
        </div>
      ))}
    </div>
  );
}

function DetailGrid({ title, items }: { title?: string; items: Array<[string, string]> }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      {title ? <p className="mb-3 text-sm font-semibold text-slate-900">{title}</p> : null}
      <dl className="grid gap-3 md:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{productizeText(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{productizeText(text)}</p>
    </div>
  );
}

function Metric({ label, value, status }: { label: string; value: string; status: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-muted)] px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{value}</p>
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return <p className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-4 text-sm text-slate-600">{text}</p>;
}

function statusFor(running: boolean, completed: boolean) {
  if (completed) {
    return 'completed';
  }

  return running ? 'running' : 'not_started';
}

function getWorkflowState(input: {
  loading: boolean;
  deciding: DecisionOutcome;
  outcome: DecisionOutcome;
  status?: string | undefined;
  pendingApprovalId?: string | undefined;
}) {
  if (input.loading) {
    return { key: 'running', label: 'Running', status: 'running' };
  }

  if (input.deciding === 'approved') {
    return { key: 'executing_response', label: 'Executing response', status: 'running' };
  }

  if (input.deciding === 'rejected') {
    return { key: 'rejected', label: 'Rejected', status: 'rejected' };
  }

  if (input.outcome === 'rejected' || input.status === 'cancelled' || input.status === 'rejected') {
    return { key: 'rejected', label: 'Rejected', status: 'rejected' };
  }

  if (input.status === 'success') {
    return { key: 'completed', label: 'Completed', status: 'completed' };
  }

  if (input.status === 'failed') {
    return { key: 'failed', label: 'Failed', status: 'failed' };
  }

  if (input.outcome === 'approved' || input.status === 'approved') {
    return { key: 'approved', label: 'Approved', status: 'approved' };
  }

  if (input.pendingApprovalId || input.status === 'waiting_approval') {
    return {
      key: 'waiting_approval',
      label: 'Waiting for analyst approval',
      status: 'waiting_approval',
    };
  }

  if (input.status === 'running') {
    return { key: 'running', label: 'Running', status: 'running' };
  }

  return { key: 'not_started', label: 'Not started', status: 'not_started' };
}

function getStateMachine(activeKey: string) {
  return [
    ['not_started', 'Not started'],
    ['running', 'Running'],
    ['waiting_approval', 'Waiting for analyst approval'],
    ['approved', 'Approved'],
    ['executing_response', 'Executing response'],
    ['completed', 'Completed'],
    ['rejected', 'Rejected'],
    ['failed', 'Failed'],
  ].map(([key, label]) => ({ key, label, active: key === activeKey }));
}

function isTerminalWorkflow(status?: string) {
  return status === 'success' || status === 'failed' || status === 'cancelled' || status === 'rejected';
}

function normalizeTaskStatus(status: string) {
  if (status === 'success') {
    return 'completed';
  }

  if (status === 'waiting_approval') {
    return 'pending';
  }

  return status;
}

function artifactLinks(result: DemoRunResult | null, artifacts: DemoArtifacts) {
  const links = [
    result?.alertId ? { label: 'Alert', href: `/alerts/${result.alertId}` } : undefined,
    result?.recommendationId
      ? { label: 'Recommendation', href: `/recommendations/${result.recommendationId}` }
      : undefined,
    result?.explanationId ? { label: 'Explanation', href: `/explanations/${result.explanationId}` } : undefined,
    result?.executionId ? { label: 'Workflow', href: `/workflows/${result.executionId}` } : undefined,
    artifacts.incident ? { label: 'Incident', href: `/incidents/${artifacts.incident.incidentId}` } : undefined,
    artifacts.report ? { label: 'Report', href: `/reports/${artifacts.report.reportId}` } : undefined,
  ];

  return links.filter((link): link is { label: string; href: string } => Boolean(link));
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Pending';
}

function humanizeAction(action: string) {
  return action
    .replace(/^mock_notify_/, 'notify_')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function productizeText(value: string) {
  return value
    .replace(/mock-only/gi, 'approval-gated')
    .replace(/mock request/gi, 'approval request')
    .replace(/mock workflow/gi, 'response workflow')
    .replace(/mock incident/gi, 'incident')
    .replace(/mock enrichment/gi, 'enrichment')
    .replace(/mock notification/gi, 'notification')
    .replace(/mock response/gi, 'response')
    .replace(/\bMock\b/g, 'Workflow')
    .replace(/\bmock\b/g, 'workflow')
    .replace(/No real security action was executed\./gi, 'Workflow records were updated.')
    .replace(/All actions were approval-gated\./gi, 'All response actions were tracked in the workflow.')
    .replace(/demo reporting/gi, 'operational reporting');
}
