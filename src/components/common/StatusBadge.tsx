import { cn } from '@/lib/utils';

type StatusType = 'active' | 'inactive' | 'pending' | 'approved' | 'suspended' | 'completed' | 'cancelled' | 'draft' | 'sold' | 'archived' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'confirmed' | 'failed' | 'open' | 'fulfilled' | 'closed' | 'rejected' | 'scheduled' | 'ended' | 'new' | 'like_new' | 'good' | 'fair';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Active/Success states
  active: 'status-active',
  approved: 'status-active',
  completed: 'status-active',
  delivered: 'status-active',
  fulfilled: 'status-active',
  confirmed: 'status-active',
  
  // Pending/Warning states
  pending: 'status-pending',
  processing: 'status-pending',
  shipped: 'status-pending',
  scheduled: 'status-pending',
  open: 'status-pending',
  
  // Inactive/Muted states
  inactive: 'status-inactive',
  draft: 'status-inactive',
  archived: 'status-inactive',
  closed: 'status-inactive',
  ended: 'status-inactive',
  
  // Error/Destructive states
  suspended: 'status-error',
  cancelled: 'status-error',
  refunded: 'status-error',
  failed: 'status-error',
  rejected: 'status-error',
  
  // Special states
  sold: 'bg-primary/20 text-primary',
  new: 'bg-success/20 text-success',
  like_new: 'bg-success/15 text-success',
  good: 'bg-chart-3/20 text-chart-3',
  fair: 'bg-warning/20 text-warning',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const styleClass = statusStyles[normalizedStatus] || 'status-inactive';
  
  const displayStatus = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span className={cn('status-badge', styleClass, className)}>
      {displayStatus}
    </span>
  );
}

export default StatusBadge;
