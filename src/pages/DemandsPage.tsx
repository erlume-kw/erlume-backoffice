import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FilterBar } from '@/components/common/FilterBar';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Demand } from '@/types/models';
import { Megaphone, DollarSign, User, Calendar } from 'lucide-react';

// Mock data
const mockDemands: Demand[] = [
  { _id: '1', userId: 'u1', title: 'Looking for Chanel Classic Flap', description: 'Medium size, black caviar leather, gold hardware. Must be authentic with box and papers.', maxPrice: 5000, status: 'open', createdAt: '2024-01-20T10:30:00Z', updatedAt: '2024-01-20T10:30:00Z' },
  { _id: '2', userId: 'u2', title: 'Hermès Birkin 25', description: 'Any color considered, prefer neutral tones. Looking for good condition or better.', maxPrice: 15000, status: 'open', createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-19T08:00:00Z' },
  { _id: '3', userId: 'u3', title: 'Vintage Rolex Datejust', description: 'Looking for 1980s models, two-tone preferred. Service history a plus.', maxPrice: 8000, status: 'fulfilled', createdAt: '2024-01-18T14:30:00Z', updatedAt: '2024-01-20T16:00:00Z' },
  { _id: '4', userId: 'u4', title: 'Gucci Horsebit Loafers Size 42', description: 'Black leather, any condition as long as they can be worn.', maxPrice: 400, status: 'open', createdAt: '2024-01-17T11:00:00Z', updatedAt: '2024-01-17T11:00:00Z' },
  { _id: '5', userId: 'u5', title: 'Louis Vuitton Keepall 55', description: 'Monogram canvas, bandoulière strap included. Good condition minimum.', maxPrice: 1200, status: 'closed', createdAt: '2024-01-16T16:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
  { _id: '6', userId: 'u6', title: 'Prada Nylon Backpack', description: 'Black or navy, vintage 90s style preferred. Light wear acceptable.', maxPrice: 600, status: 'open', createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-15T09:00:00Z' },
];

export default function DemandsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);

  const columns: Column<Demand>[] = [
    {
      key: 'title',
      header: 'Request',
      render: (demand) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${demand.status === 'open' ? 'bg-primary/10' : demand.status === 'fulfilled' ? 'bg-success/10' : 'bg-muted'}`}>
            <Megaphone className={`h-4 w-4 ${demand.status === 'open' ? 'text-primary' : demand.status === 'fulfilled' ? 'text-success' : 'text-muted-foreground'}`} />
          </div>
          <div className="max-w-[300px]">
            <p className="font-medium text-foreground truncate">{demand.title}</p>
            <p className="text-sm text-muted-foreground truncate">{demand.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'maxPrice',
      header: 'Budget',
      render: (demand) => (
        <span className="font-medium text-success">
          {demand.maxPrice ? `Up to $${demand.maxPrice.toLocaleString()}` : 'Flexible'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (demand) => <StatusBadge status={demand.status} />,
    },
    {
      key: 'createdAt',
      header: 'Posted',
      render: (demand) => (
        <span className="text-muted-foreground">
          {new Date(demand.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredDemands = mockDemands.filter((demand) => {
    const matchesSearch = search === '' ||
      demand.title.toLowerCase().includes(search.toLowerCase()) ||
      demand.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || demand.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Demands"
        description="Manage customer item requests and wishlists"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search demands..."
        onAdd={() => { setEditingDemand(null); setShowForm(true); }}
        addLabel="Create Demand"
      />

      <div className="p-6 space-y-4">
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: filters.status,
              options: [
                { value: 'open', label: 'Open' },
                { value: 'fulfilled', label: 'Fulfilled' },
                { value: 'closed', label: 'Closed' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters({})}
        />

        <DataTable
          data={filteredDemands}
          columns={columns}
          keyExtractor={(demand) => demand._id}
          onView={(demand) => setSelectedDemand(demand)}
          onEdit={(demand) => { setEditingDemand(demand); setShowForm(true); }}
          onDelete={(demand) => console.log('Delete demand:', demand._id)}
        />
      </div>

      {/* View Demand Panel */}
      <DetailPanel
        open={!!selectedDemand}
        onClose={() => setSelectedDemand(null)}
        title="Demand Details"
        description={selectedDemand?.title}
      >
        {selectedDemand && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${selectedDemand.status === 'open' ? 'bg-primary/10' : 'bg-success/10'}`}>
                <Megaphone className={`h-6 w-6 ${selectedDemand.status === 'open' ? 'text-primary' : 'text-success'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedDemand.title}</h3>
                <StatusBadge status={selectedDemand.status} />
              </div>
            </div>
            <p className="text-muted-foreground">{selectedDemand.description}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-semibold">
                    {selectedDemand.maxPrice ? `Up to $${selectedDemand.maxPrice.toLocaleString()}` : 'Flexible'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{selectedDemand.userId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted</p>
                  <p>{new Date(selectedDemand.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            {selectedDemand.status === 'open' && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">Mark Fulfilled</Button>
                <Button variant="outline" className="flex-1">Close</Button>
              </div>
            )}
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit Demand Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingDemand(null); }}
        title={editingDemand ? 'Edit Demand' : 'Create Demand'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={editingDemand?.title} placeholder="What are you looking for?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingDemand?.description} placeholder="Describe the item in detail..." rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxPrice">Max Budget ($)</Label>
              <Input id="maxPrice" type="number" defaultValue={editingDemand?.maxPrice} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingDemand?.status || 'open'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingDemand(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingDemand ? 'Save Changes' : 'Create Demand'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
