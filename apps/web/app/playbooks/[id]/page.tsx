import { FutureNote } from '../../../components/future-note';
import { PageIntro } from '../../../components/page-intro';
import { PlaybookDetail } from '../../../components/playbook-detail';

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Playbook ${id}`}
        role="Playbook Detail"
        description="This page shows the structured metadata, matching conditions, ordered actions, references, and safety guardrails for a single playbook."
      />
      <PlaybookDetail playbookId={id} />
      <FutureNote note="Sensitive actions remain request or recommendation steps only until explicit analyst approval and workflow controls are implemented in later phases." />
    </>
  );
}
