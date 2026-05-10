type BadgeTone = 'success' | 'danger' | 'warning' | 'processing' | 'info';

const statusLabels: Record<string, string> = {
  active: 'Đang dùng',
  alert_generated: 'Đã sinh cảnh báo',
  approved: 'Đã phê duyệt',
  closed: 'Đã đóng',
  completed: 'Hoàn thành',
  complete: 'Hoàn thành',
  cancelled: 'Đã dừng',
  executing_response: 'Đang phản hồi',
  failed: 'Thất bại',
  failure: 'Thất bại',
  generated: 'Đã tạo',
  in_progress: 'Đang xử lý',
  invalid: 'Không hợp lệ',
  live_api: 'API',
  new: 'Mới',
  not_started: 'Chưa bắt đầu',
  open: 'Đang mở',
  pending: 'Đang chờ',
  parsing: 'Đang phân tích',
  processing: 'Đang xử lý',
  queued: 'Đã xếp hàng',
  ready_for_review: 'Sẵn sàng review',
  recommended: 'Đã khuyến nghị',
  rejected: 'Đã từ chối',
  resolved: 'Đã xử lý',
  running: 'Đang xử lý',
  selected: 'Đã chọn',
  success: 'Thành công',
  valid: 'Hợp lệ',
  waiting_approval: 'Chờ phê duyệt',
  uploaded: 'Đã upload',
  normalized: 'Đã chuẩn hóa',
  stale: 'Cũ',
  not_generated: 'Not generated',
};

export function formatStatusVi(status?: string | null) {
  if (!status) {
    return 'Chưa có';
  }

  const normalized = status.toLowerCase().replaceAll(' ', '_');
  return statusLabels[normalized] ?? status.replaceAll('_', ' ');
}

export function statusTone(status?: string | null): BadgeTone {
  const normalized = status?.toLowerCase().replaceAll(' ', '_') ?? '';

  if (['success', 'completed', 'complete', 'approved', 'resolved', 'closed', 'valid', 'active', 'uploaded', 'alert_generated', 'normalized', 'recommended', 'ready_for_review'].includes(normalized)) {
    return 'success';
  }

  if (['failed', 'failure', 'error', 'rejected', 'invalid', 'cancelled'].includes(normalized)) {
    return 'danger';
  }

  if (['pending', 'waiting_approval', 'queued'].includes(normalized)) {
    return 'warning';
  }

  if (['processing', 'running', 'in_progress', 'parsing'].includes(normalized)) {
    return 'processing';
  }

  return 'info';
}

export function StatusBadge({ status }: { status?: string | null }) {
  const tone = statusTone(status);
  const classNameByTone: Record<BadgeTone, string> = {
    success: 'border-[rgba(158,206,106,0.35)] bg-[rgba(158,206,106,0.14)] text-[var(--success)]',
    danger: 'border-[rgba(247,118,142,0.35)] bg-[rgba(247,118,142,0.14)] text-[var(--danger)]',
    warning: 'border-[rgba(224,175,104,0.35)] bg-[rgba(224,175,104,0.14)] text-[var(--warning)]',
    processing: 'border-[rgba(122,162,247,0.35)] bg-[rgba(122,162,247,0.14)] text-[var(--accent)]',
    info: 'border-[rgba(187,154,247,0.35)] bg-[rgba(187,154,247,0.14)] text-[var(--purple)]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${classNameByTone[tone]}`}
    >
      {formatStatusVi(status)}
    </span>
  );
}

const severityClasses: Record<string, string> = {
  low: 'border-[rgba(158,206,106,0.35)] bg-[rgba(158,206,106,0.14)] text-[var(--success)]',
  medium: 'border-[rgba(224,175,104,0.35)] bg-[rgba(224,175,104,0.14)] text-[var(--warning)]',
  high: 'border-[rgba(247,118,142,0.35)] bg-[rgba(247,118,142,0.14)] text-[var(--danger)]',
  critical: 'border-[rgba(247,118,142,0.5)] bg-[rgba(247,118,142,0.22)] text-[var(--danger)]',
};

export function SeverityBadge({ severity }: { severity?: string | null | undefined }) {
  if (!severity) {
    return <StatusBadge status="pending" />;
  }

  const normalized = severity.toLowerCase();

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        severityClasses[normalized] ?? severityClasses.medium
      }`}
    >
      {normalized}
    </span>
  );
}

export function formatSourceLabel(source?: string | null) {
  if (!source) {
    return 'Unknown';
  }

  if (source === 'pcap_demo') {
    return 'PCAP Intake';
  }

  return source.replaceAll('_', ' ');
}
