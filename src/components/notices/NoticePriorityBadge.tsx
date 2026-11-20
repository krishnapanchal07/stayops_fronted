import { Badge } from '@/components/common/Badge';
import { NOTICE_PRIORITY_LABELS, type NoticePriority } from '@/types/notice';
import type { BadgeVariant } from '@/types/ui';

const variants: Record<NoticePriority, BadgeVariant> = {
  LOW: 'success',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

interface NoticePriorityBadgeProps {
  priority: NoticePriority;
}

export function NoticePriorityBadge({ priority }: NoticePriorityBadgeProps) {
  return <Badge variant={variants[priority]}>{NOTICE_PRIORITY_LABELS[priority]}</Badge>;
}
