import { SEED_PLAYBOOK_IDS } from '@soc-soar/shared';

import { FutureNote } from '../../components/future-note';
import { PageIntro } from '../../components/page-intro';
import { PlaybooksTable } from '../../components/playbooks-table';

export default function PlaybooksPage() {
  return (
    <>
      <PageIntro
        title="Playbooks"
        role="Bộ dữ liệu phản hồi có cấu trúc"
        description={`Danh mục playbook dùng cho khuyến nghị, giải thích, phê duyệt, điều phối và báo cáo. Bộ seed có ${SEED_PLAYBOOK_IDS.length} playbook phản hồi mô phỏng có cấu trúc.`}
      />
      <PlaybooksTable />
      <FutureNote note="Playbook là mẫu phản hồi máy đọc được. Các bước giống containment chỉ là yêu cầu demo cần analyst phê duyệt." />
    </>
  );
}
