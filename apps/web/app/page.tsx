import { DashboardSummaryPanel } from '../components/dashboard-summary';
import { PageIntro } from '../components/page-intro';
import { WorkflowStrip } from '../components/workflow-strip';

export default function HomePage() {
  return (
    <>
      <PageIntro
        title="SOARisk SOC Automation"
        role="Operational Overview"
        description="SOC/SOAR operations console for alert response, approval gates, workflow execution and incident reporting."
      />
      <WorkflowStrip />
      <DashboardSummaryPanel />
    </>
  );
}
