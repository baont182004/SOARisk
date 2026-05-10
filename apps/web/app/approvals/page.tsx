import { PageIntro } from '../../components/page-intro';
import { ApprovalsTable } from '../../components/approvals-table';

export default function ApprovalsPage() {
  return (
    <>
      <PageIntro title="Analyst Approval" role="Decision Gate" description="Pending and completed analyst approval decisions." />
      <ApprovalsTable />
    </>
  );
}
