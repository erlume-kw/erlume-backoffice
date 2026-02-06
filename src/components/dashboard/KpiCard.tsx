import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  format?: 'number' | 'currency' | 'percentage';
}

export function KpiCard({ title, value, change, icon, trend, format = 'number' }: KpiCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    switch (format) {
      case 'currency':
        return `KD ${new Intl.NumberFormat('en-US').format(val)}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-destructive';
    return 'text-muted-foreground';
  };

  return (
    <div className="kpi-card animate-fade-in">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon && <div className="text-primary">{icon}</div>}
        </div>
        <div className="flex items-end justify-between">
          <span className="text-3xl font-bold text-foreground">{formatValue(value)}</span>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KpiCard;
