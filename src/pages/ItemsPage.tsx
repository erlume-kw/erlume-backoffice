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
import type { Item } from '@/types/models';
import { Eye, Heart, DollarSign, Tag } from 'lucide-react';

// Mock data
const mockItems: Item[] = [
  { _id: '1', sellerId: 's1', categoryId: 'c1', title: 'Vintage Chanel Bag', description: 'Authentic vintage Chanel quilted bag', brand: 'Chanel', condition: 'good', originalPrice: 3500, price: 2800, images: [], status: 'active', views: 1234, likes: 89, createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-20T14:00:00Z' },
  { _id: '2', sellerId: 's2', categoryId: 'c2', title: 'Gucci Loafers Size 9', description: 'Classic Gucci horsebit loafers', brand: 'Gucci', size: '9', condition: 'like_new', originalPrice: 890, price: 650, images: [], status: 'active', views: 567, likes: 45, createdAt: '2024-01-14T09:00:00Z', updatedAt: '2024-01-19T12:00:00Z' },
  { _id: '3', sellerId: 's1', categoryId: 'c3', title: 'Prada Milano Dress', description: 'Black Prada dress, perfect condition', brand: 'Prada', size: 'M', color: 'Black', condition: 'new', originalPrice: 1200, price: 950, images: [], status: 'pending', views: 234, likes: 28, createdAt: '2024-01-13T14:30:00Z', updatedAt: '2024-01-18T10:00:00Z' },
  { _id: '4', sellerId: 's3', categoryId: 'c1', title: 'Louis Vuitton Wallet', description: 'LV monogram wallet, slight wear', brand: 'Louis Vuitton', condition: 'fair', originalPrice: 650, price: 380, images: [], status: 'sold', views: 892, likes: 67, createdAt: '2024-01-12T11:00:00Z', updatedAt: '2024-01-17T16:00:00Z' },
  { _id: '5', sellerId: 's2', categoryId: 'c4', title: 'Burberry Trench Coat', description: 'Classic Burberry trench, size L', brand: 'Burberry', size: 'L', color: 'Beige', condition: 'good', originalPrice: 1800, price: 1200, images: [], status: 'active', views: 456, likes: 34, createdAt: '2024-01-11T08:30:00Z', updatedAt: '2024-01-16T13:00:00Z' },
  { _id: '6', sellerId: 's4', categoryId: 'c2', title: 'Jimmy Choo Heels', description: 'Silver Jimmy Choo stilettos', brand: 'Jimmy Choo', size: '7', color: 'Silver', condition: 'like_new', originalPrice: 750, price: 520, images: [], status: 'draft', views: 123, likes: 15, createdAt: '2024-01-10T15:00:00Z', updatedAt: '2024-01-15T09:30:00Z' },
  { _id: '7', sellerId: 's1', categoryId: 'c5', title: 'Rolex Submariner', description: 'Rolex Submariner Date, 2019', brand: 'Rolex', condition: 'good', originalPrice: 12000, price: 9500, images: [], status: 'active', views: 2341, likes: 156, createdAt: '2024-01-09T12:00:00Z', updatedAt: '2024-01-14T17:00:00Z' },
  { _id: '8', sellerId: 's5', categoryId: 'c3', title: 'Hermès Silk Scarf', description: 'Beautiful Hermès silk scarf, floral print', brand: 'Hermès', color: 'Multi', condition: 'new', originalPrice: 450, price: 380, images: [], status: 'archived', views: 789, likes: 52, createdAt: '2024-01-08T10:30:00Z', updatedAt: '2024-01-13T14:00:00Z' },
];

export default function ItemsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const columns: Column<Item>[] = [
    {
      key: 'title',
      header: 'Item',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Tag className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.brand}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      render: (item) => (
        <div>
          <p className="font-medium text-foreground">${item.price.toLocaleString()}</p>
          {item.originalPrice > item.price && (
            <p className="text-sm text-muted-foreground line-through">${item.originalPrice.toLocaleString()}</p>
          )}
        </div>
      ),
    },
    {
      key: 'condition',
      header: 'Condition',
      render: (item) => <StatusBadge status={item.condition} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'engagement',
      header: 'Engagement',
      render: (item) => (
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span className="text-sm">{item.views}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span className="text-sm">{item.likes}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Listed',
      render: (item) => (
        <span className="text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredItems = mockItems.filter((item) => {
    const matchesSearch = search === '' ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || item.status === filters.status;
    const matchesCondition = !filters.condition || item.condition === filters.condition;
    return matchesSearch && matchesStatus && matchesCondition;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Items"
        description="Manage marketplace listings and inventory"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search items..."
        onAdd={() => { setEditingItem(null); setShowForm(true); }}
        addLabel="Add Item"
      />

      <div className="p-6 space-y-4">
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: filters.status,
              options: [
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending' },
                { value: 'active', label: 'Active' },
                { value: 'sold', label: 'Sold' },
                { value: 'archived', label: 'Archived' },
              ],
            },
            {
              key: 'condition',
              label: 'Condition',
              value: filters.condition,
              options: [
                { value: 'new', label: 'New' },
                { value: 'like_new', label: 'Like New' },
                { value: 'good', label: 'Good' },
                { value: 'fair', label: 'Fair' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters({})}
        />

        <DataTable
          data={filteredItems}
          columns={columns}
          keyExtractor={(item) => item._id}
          onView={(item) => setSelectedItem(item)}
          onEdit={(item) => { setEditingItem(item); setShowForm(true); }}
          onDelete={(item) => console.log('Delete item:', item._id)}
        />
      </div>

      {/* View Item Panel */}
      <DetailPanel
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Item Details"
        description={selectedItem?.title}
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Tag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedItem.title}</h3>
                <p className="text-muted-foreground">{selectedItem.brand}</p>
              </div>
              <StatusBadge status={selectedItem.status} />
            </div>
            <p className="text-muted-foreground">{selectedItem.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-lg font-semibold">${selectedItem.price.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Condition</p>
                <StatusBadge status={selectedItem.condition} />
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-lg font-semibold">{selectedItem.views}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">Likes</p>
                <p className="text-lg font-semibold">{selectedItem.likes}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setEditingItem(selectedItem); setShowForm(true); setSelectedItem(null); }}>
              Edit Item
            </Button>
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit Item Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingItem(null); }}
        title={editingItem ? 'Edit Item' : 'Add Item'}
        type="dialog"
        size="lg"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" defaultValue={editingItem?.title} placeholder="Enter item title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingItem?.description} placeholder="Enter description" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input id="brand" defaultValue={editingItem?.brand} placeholder="Enter brand" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select defaultValue={editingItem?.condition || 'good'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Original Price</Label>
              <Input id="originalPrice" type="number" defaultValue={editingItem?.originalPrice} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Sale Price</Label>
              <Input id="price" type="number" defaultValue={editingItem?.price} placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input id="size" defaultValue={editingItem?.size} placeholder="Size" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input id="color" defaultValue={editingItem?.color} placeholder="Color" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingItem?.status || 'draft'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingItem(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
