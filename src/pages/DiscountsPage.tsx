import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DiscountCode } from '@/types/models';
import { Ticket, Percent, DollarSign, Copy } from 'lucide-react';
import { toast } from 'sonner';

// Mock data
const mockDiscountCodes: DiscountCode[] = [
  { _id: '1', code: 'SPRING24', type: 'percentage', value: 20, minPurchase: 100, maxUses: 500, usedCount: 234, startDate: '2024-03-01T00:00:00Z', endDate: '2024-03-31T23:59:59Z', isActive: true, createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
  { _id: '2', code: 'VALENTINE15', type: 'percentage', value: 15, minPurchase: 50, maxUses: 200, usedCount: 156, startDate: '2024-02-01T00:00:00Z', endDate: '2024-02-14T23:59:59Z', isActive: true, createdAt: '2024-01-15T14:00:00Z', updatedAt: '2024-01-15T14:00:00Z' },
  { _id: '3', code: 'FREESHIP', type: 'fixed', value: 15, startDate: '2024-01-01T00:00:00Z', endDate: '2024-12-31T23:59:59Z', isActive: true, usedCount: 1892, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { _id: '4', code: 'NEWUSER25', type: 'percentage', value: 25, minPurchase: 75, maxUses: 1000, usedCount: 423, startDate: '2024-01-01T00:00:00Z', endDate: '2024-06-30T23:59:59Z', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { _id: '5', code: 'VIP50', type: 'fixed', value: 50, minPurchase: 200, maxUses: 100, usedCount: 100, startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-31T23:59:59Z', isActive: false, createdAt: '2023-12-15T10:00:00Z', updatedAt: '2024-02-01T00:00:00Z' },
  { _id: '6', code: 'FLASH10', type: 'percentage', value: 10, startDate: '2024-01-20T00:00:00Z', endDate: '2024-01-21T23:59:59Z', isActive: false, usedCount: 89, createdAt: '2024-01-19T20:00:00Z', updatedAt: '2024-01-22T00:00:00Z' },
];

export default function DiscountsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  const columns: Column<DiscountCode>[] = [
    {
      key: 'code',
      header: 'Code',
      render: (dc) => (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Ticket className="h-4 w-4 text-primary" />
          </div>
          <code className="font-mono font-semibold text-foreground">{dc.code}</code>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(dc.code)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Discount',
      render: (dc) => (
        <div className="flex items-center gap-1">
          {dc.type === 'percentage' ? (
            <>
              <span className="font-semibold text-success">{dc.value}%</span>
              <Percent className="h-4 w-4 text-success" />
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 text-success" />
              <span className="font-semibold text-success">{dc.value}</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'minPurchase',
      header: 'Min. Purchase',
      render: (dc) => (
        <span className="text-muted-foreground">
          {dc.minPurchase ? `$${dc.minPurchase}` : '—'}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Usage',
      render: (dc) => (
        <span className="text-muted-foreground">
          {dc.usedCount}{dc.maxUses ? `/${dc.maxUses}` : ''}
        </span>
      ),
    },
    {
      key: 'dates',
      header: 'Valid Until',
      render: (dc) => (
        <span className="text-muted-foreground">
          {new Date(dc.endDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (dc) => (
        <span className={`text-sm font-medium ${dc.isActive ? 'text-success' : 'text-muted-foreground'}`}>
          {dc.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const filteredCodes = mockDiscountCodes.filter((dc) => {
    return search === '' || dc.code.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Discount Codes"
        description="Create and manage promotional discount codes"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search codes..."
        onAdd={() => { setEditingCode(null); setShowForm(true); }}
        addLabel="Create Code"
      />

      <div className="p-6">
        <DataTable
          data={filteredCodes}
          columns={columns}
          keyExtractor={(dc) => dc._id}
          onEdit={(dc) => { setEditingCode(dc); setShowForm(true); }}
          onDelete={(dc) => console.log('Delete code:', dc._id)}
        />
      </div>

      {/* Add/Edit Discount Code Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCode(null); }}
        title={editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" defaultValue={editingCode?.code} placeholder="SUMMER20" className="uppercase" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select defaultValue={editingCode?.type || 'percentage'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" type="number" defaultValue={editingCode?.value} placeholder="20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPurchase">Min. Purchase ($)</Label>
              <Input id="minPurchase" type="number" defaultValue={editingCode?.minPurchase} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input id="maxUses" type="number" defaultValue={editingCode?.maxUses} placeholder="Unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" defaultValue={editingCode?.startDate?.split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" defaultValue={editingCode?.endDate?.split('T')[0]} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch id="isActive" defaultChecked={editingCode?.isActive ?? true} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingCode(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingCode ? 'Save Changes' : 'Create Code'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
