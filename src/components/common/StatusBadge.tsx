import { cn } from '@/lib/utils';

type StatusType =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'suspended'
  | 'completed'
  | 'cancelled'
  | 'draft'
  | 'sold'
  | 'archived'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'refunded'
  | 'confirmed'
  | 'failed'
  | 'open'
  | 'fulfilled'
  | 'closed'
  | 'rejected'
  | 'scheduled'
  | 'upcoming'
  | 'ended'
  | 'returned'
  | 'partially_refunded'
  | 'new'
  | 'like_new'
  | 'gently_used'
  | 'fair_condition'
  | 'worn_condition'
  | 'good'
  | 'fair'
  | 'available'
  | 'out_of_stock';

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
  available: 'status-active',
  
  // Pending/Warning states
  pending: 'status-pending',
  processing: 'status-pending',
  shipped: 'status-pending',
  scheduled: 'status-pending',
  upcoming: 'status-pending',
  open: 'status-pending',
  partially_refunded: 'status-pending',
  
  // Inactive/Muted states
  inactive: 'status-inactive',
  draft: 'status-inactive',
  archived: 'status-inactive',
  closed: 'status-inactive',
  ended: 'status-inactive',
  out_of_stock: 'status-inactive',
  sold: 'status-inactive',
  
  // Error/Destructive states
  suspended: 'status-error',
  cancelled: 'status-error',
  refunded: 'status-error',
  failed: 'status-error',
  rejected: 'status-error',
  returned: 'status-error',
  
  // Special states
  new: 'bg-success/20 text-success',
  like_new: 'bg-success/15 text-success',
  gently_used: 'bg-chart-3/20 text-chart-3',
  fair_condition: 'bg-warning/20 text-warning',
  worn_condition: 'bg-destructive/15 text-destructive',
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
