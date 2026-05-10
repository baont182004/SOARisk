import { PageIntro } from '../../../components/page-intro';
import { PlaybookDetail } from '../../../components/playbook-detail';

export default async function PlaybookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <PageIntro
        title={`Playbook ${id}`}
        role="Playbook Detail"
        description="Structured response metadata, matching conditions and workflow actions."
      />
      <PlaybookDetail playbookId={id} />
    </>
  );
}
