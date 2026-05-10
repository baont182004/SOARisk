import { DemoWizard } from '../../components/demo-wizard';
import { PageIntro } from '../../components/page-intro';

export default function DemoPage() {
  return (
    <>
      <PageIntro
        title="SOAR Run Console"
        role="SOAR Execution Pipeline"
        description="Execution timeline for alert response workflow runs."
      />
      <DemoWizard />
    </>
  );
}
