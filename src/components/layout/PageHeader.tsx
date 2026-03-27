import { ReactNode } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
  onAdd?: () => void;
  addLabel?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export function PageHeader({
  title,
  description,
  children,
  onAdd,
  addLabel = 'Add New',
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
}: PageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="px-4 py-4 pl-16 sm:px-6 sm:pl-20 lg:px-6 lg:pl-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {onSearchChange && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-10 w-64 bg-muted/50"
                />
              </div>
            )}
            {children}
            {onAdd && (
              <Button onClick={onAdd} className="gap-2">
                <Plus className="h-4 w-4" />
                {addLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
