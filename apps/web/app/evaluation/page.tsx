import { EvaluationSummaryPanel } from '../../components/evaluation-summary';
import { PageIntro } from '../../components/page-intro';

export default function EvaluationPage() {
  return (
    <>
      <PageIntro
        title="Evaluation"
        role="Operational Metrics"
        description="Recommendation quality, workflow completion and response distribution metrics."
      />
      <EvaluationSummaryPanel />
    </>
  );
}
