import { PageIntro } from '../../components/page-intro';
import { ReportsTable } from '../../components/reports-table';

export default function ReportsPage() {
  return (
    <>
      <PageIntro title="Report" role="Response Outcome" description="Generated incident response reports." />
      <ReportsTable />
    </>
  );
}
