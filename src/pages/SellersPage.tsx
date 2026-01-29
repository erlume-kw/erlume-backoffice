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
import type { Seller } from '@/types/models';
import { Store, Star, DollarSign, TrendingUp } from 'lucide-react';

// Mock data
const mockSellers: Seller[] = [
  { _id: '1', userId: 'u1', businessName: 'Vintage Boutique', description: 'Curated vintage designer pieces', status: 'approved', rating: 4.9, totalSales: 156, commissionRate: 15, createdAt: '2024-01-10T10:30:00Z', updatedAt: '2024-01-20T14:00:00Z' },
  { _id: '2', userId: 'u2', businessName: 'Modern Luxe', description: 'Contemporary luxury fashion', status: 'approved', rating: 4.7, totalSales: 142, commissionRate: 12, createdAt: '2024-01-08T08:00:00Z', updatedAt: '2024-01-18T16:30:00Z' },
  { _id: '3', userId: 'u3', businessName: 'Classic Finds', description: 'Timeless classic clothing', status: 'pending', rating: 0, totalSales: 0, commissionRate: 15, createdAt: '2024-01-15T12:00:00Z', updatedAt: '2024-01-15T12:00:00Z' },
  { _id: '4', userId: 'u4', businessName: 'Trendy Threads', description: 'Trending streetwear and fashion', status: 'approved', rating: 4.5, totalSales: 115, commissionRate: 18, createdAt: '2024-01-05T14:30:00Z', updatedAt: '2024-01-12T11:00:00Z' },
  { _id: '5', userId: 'u5', businessName: 'Eco Fashion', description: 'Sustainable and eco-friendly clothing', status: 'approved', rating: 4.8, totalSales: 98, commissionRate: 10, createdAt: '2023-12-28T16:00:00Z', updatedAt: '2024-01-08T10:00:00Z' },
  { _id: '6', userId: 'u6', businessName: 'Designer Deals', description: 'Discounted designer items', status: 'suspended', rating: 3.2, totalSales: 45, commissionRate: 20, createdAt: '2023-12-20T09:00:00Z', updatedAt: '2024-01-05T15:30:00Z' },
];

export default function SellersPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);

  const columns: Column<Seller>[] = [
    {
      key: 'businessName',
      header: 'Seller',
      render: (seller) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{seller.businessName}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{seller.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (seller) => <StatusBadge status={seller.status} />,
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (seller) => (
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-warning fill-warning" />
          <span className="font-medium">{seller.rating > 0 ? seller.rating.toFixed(1) : '—'}</span>
        </div>
      ),
    },
    {
      key: 'totalSales',
      header: 'Sales',
      render: (seller) => <span className="font-medium">{seller.totalSales}</span>,
    },
    {
      key: 'commissionRate',
      header: 'Commission',
      render: (seller) => <span className="text-muted-foreground">{seller.commissionRate}%</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (seller) => (
        <span className="text-muted-foreground">
          {new Date(seller.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredSellers = mockSellers.filter((seller) => {
    const matchesSearch = search === '' || seller.businessName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || seller.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Sellers"
        description="Manage marketplace sellers and their stores"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search sellers..."
        onAdd={() => { setEditingSeller(null); setShowForm(true); }}
        addLabel="Add Seller"
      />

      <div className="p-6 space-y-4">
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: filters.status,
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'suspended', label: 'Suspended' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters({})}
        />

        <DataTable
          data={filteredSellers}
          columns={columns}
          keyExtractor={(seller) => seller._id}
          onView={(seller) => setSelectedSeller(seller)}
          onEdit={(seller) => { setEditingSeller(seller); setShowForm(true); }}
          onDelete={(seller) => console.log('Delete seller:', seller._id)}
        />
      </div>

      {/* View Seller Panel */}
      <DetailPanel
        open={!!selectedSeller}
        onClose={() => setSelectedSeller(null)}
        title="Seller Details"
        description={selectedSeller?.businessName}
      >
        {selectedSeller && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedSeller.businessName}</h3>
                <StatusBadge status={selectedSeller.status} />
              </div>
            </div>
            <p className="text-muted-foreground">{selectedSeller.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-warning" />
                  <span className="text-sm text-muted-foreground">Rating</span>
                </div>
                <p className="text-lg font-semibold">{selectedSeller.rating > 0 ? selectedSeller.rating.toFixed(1) : 'N/A'}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                </div>
                <p className="text-lg font-semibold">{selectedSeller.totalSales}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Commission Rate</span>
                </div>
                <p className="text-lg font-semibold">{selectedSeller.commissionRate}%</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setEditingSeller(selectedSeller); setShowForm(true); setSelectedSeller(null); }}>
              Edit Seller
            </Button>
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit Seller Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingSeller(null); }}
        title={editingSeller ? 'Edit Seller' : 'Add Seller'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input id="businessName" defaultValue={editingSeller?.businessName} placeholder="Enter business name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingSeller?.description} placeholder="Enter description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input id="commissionRate" type="number" defaultValue={editingSeller?.commissionRate || 15} min={0} max={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingSeller?.status || 'pending'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingSeller(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingSeller ? 'Save Changes' : 'Add Seller'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
