type BadgeTone = 'success' | 'danger' | 'warning' | 'processing' | 'info';

const statusLabels: Record<string, string> = {
  active: 'Đang dùng',
  approved: 'Đã phê duyệt',
  closed: 'Đã đóng',
  completed: 'Hoàn thành',
  complete: 'Hoàn thành',
  failed: 'Thất bại',
  failure: 'Thất bại',
  generated: 'Đã tạo',
  in_progress: 'Đang xử lý',
  invalid: 'Không hợp lệ',
  live_api: 'Live API',
  new: 'Mới',
  open: 'Đang mở',
  pending: 'Đang chờ',
  processing: 'Đang xử lý',
  queued: 'Đã xếp hàng',
  rejected: 'Đã từ chối',
  resolved: 'Đã xử lý',
  running: 'Đang xử lý',
  selected: 'Đã chọn',
  success: 'Thành công',
  valid: 'Hợp lệ',
  waiting_approval: 'Chờ phê duyệt',
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

  if (['success', 'completed', 'complete', 'approved', 'resolved', 'closed', 'valid', 'active'].includes(normalized)) {
    return 'success';
  }

  if (['failed', 'failure', 'error', 'rejected', 'invalid', 'cancelled'].includes(normalized)) {
    return 'danger';
  }

  if (['pending', 'waiting_approval', 'queued'].includes(normalized)) {
    return 'warning';
  }

  if (['processing', 'running', 'in_progress'].includes(normalized)) {
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
