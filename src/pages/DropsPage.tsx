import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Drop } from '@/types/models';
import { Zap, Calendar, Package } from 'lucide-react';

// Mock data
const mockDrops: Drop[] = [
  { _id: '1', name: 'Spring Collection 2024', description: 'Fresh spring arrivals from top designers', startDate: '2024-03-01T00:00:00Z', endDate: '2024-03-15T23:59:59Z', status: 'scheduled', itemCount: 45, createdAt: '2024-01-20T10:00:00Z', updatedAt: '2024-01-20T10:00:00Z' },
  { _id: '2', name: 'Valentine\'s Day Special', description: 'Romantic pieces perfect for the season', startDate: '2024-02-10T00:00:00Z', endDate: '2024-02-14T23:59:59Z', status: 'scheduled', itemCount: 28, createdAt: '2024-01-18T14:00:00Z', updatedAt: '2024-01-18T14:00:00Z' },
  { _id: '3', name: 'Winter Clearance', description: 'End of season winter sale', startDate: '2024-01-15T00:00:00Z', endDate: '2024-01-31T23:59:59Z', status: 'active', itemCount: 156, createdAt: '2024-01-10T09:00:00Z', updatedAt: '2024-01-15T00:00:00Z' },
  { _id: '4', name: 'New Year Luxury', description: 'Premium items for the new year', startDate: '2024-01-01T00:00:00Z', endDate: '2024-01-10T23:59:59Z', status: 'ended', itemCount: 72, createdAt: '2023-12-20T11:00:00Z', updatedAt: '2024-01-11T00:00:00Z' },
  { _id: '5', name: 'Holiday Collection', description: 'Festive fashion for the holidays', startDate: '2023-12-01T00:00:00Z', endDate: '2023-12-31T23:59:59Z', status: 'ended', itemCount: 89, createdAt: '2023-11-15T10:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

export default function DropsPage() {
  const [search, setSearch] = useState('');
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null);

  const columns: Column<Drop>[] = [
    {
      key: 'name',
      header: 'Drop',
      render: (drop) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${drop.status === 'active' ? 'bg-success/10' : drop.status === 'scheduled' ? 'bg-primary/10' : 'bg-muted'}`}>
            <Zap className={`h-4 w-4 ${drop.status === 'active' ? 'text-success' : drop.status === 'scheduled' ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">{drop.name}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{drop.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (drop) => <StatusBadge status={drop.status} />,
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (drop) => (
        <div className="text-sm">
          <p className="text-foreground">{new Date(drop.startDate).toLocaleDateString()}</p>
          <p className="text-muted-foreground">to {new Date(drop.endDate).toLocaleDateString()}</p>
        </div>
      ),
    },
    {
      key: 'itemCount',
      header: 'Items',
      render: (drop) => (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <span>{drop.itemCount}</span>
        </div>
      ),
    },
  ];

  const filteredDrops = mockDrops.filter((drop) => {
    return search === '' || drop.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Drops"
        description="Manage scheduled product drops and collections"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search drops..."
        onAdd={() => { setEditingDrop(null); setShowForm(true); }}
        addLabel="Create Drop"
      />

      <div className="p-6">
        <DataTable
          data={filteredDrops}
          columns={columns}
          keyExtractor={(drop) => drop._id}
          onView={(drop) => setSelectedDrop(drop)}
          onEdit={(drop) => { setEditingDrop(drop); setShowForm(true); }}
          onDelete={(drop) => console.log('Delete drop:', drop._id)}
        />
      </div>

      {/* View Drop Panel */}
      <DetailPanel
        open={!!selectedDrop}
        onClose={() => setSelectedDrop(null)}
        title="Drop Details"
        description={selectedDrop?.name}
      >
        {selectedDrop && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${selectedDrop.status === 'active' ? 'bg-success/10' : 'bg-primary/10'}`}>
                <Zap className={`h-6 w-6 ${selectedDrop.status === 'active' ? 'text-success' : 'text-primary'}`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedDrop.name}</h3>
                <StatusBadge status={selectedDrop.status} />
              </div>
            </div>
            <p className="text-muted-foreground">{selectedDrop.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Start Date</span>
                </div>
                <p className="font-medium">{new Date(selectedDrop.startDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">End Date</span>
                </div>
                <p className="font-medium">{new Date(selectedDrop.endDate).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Items</span>
                </div>
                <p className="text-lg font-semibold">{selectedDrop.itemCount}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setEditingDrop(selectedDrop); setShowForm(true); setSelectedDrop(null); }}>
              Edit Drop
            </Button>
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit Drop Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingDrop(null); }}
        title={editingDrop ? 'Edit Drop' : 'Create Drop'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={editingDrop?.name} placeholder="Enter drop name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingDrop?.description} placeholder="Enter description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" defaultValue={editingDrop?.startDate?.split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" defaultValue={editingDrop?.endDate?.split('T')[0]} />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingDrop(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingDrop ? 'Save Changes' : 'Create Drop'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
