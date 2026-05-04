import { ApprovalsTable } from '../../components/approvals-table';
import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';

export default function ApprovalsPage() {
  return (
    <>
      <PageIntro
        title="Approvals"
        role="Analyst Gate"
        description="This page lists pending and completed approval requests created when workflows reach sensitive mock-only response steps."
      />
      <ApprovalsTable />
      <FutureNote note="Approval in Phase 8A only permits mock workflow continuation. It does not authorize or trigger a real external security action." />
    </>
  );
}
