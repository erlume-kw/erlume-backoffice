import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { Category } from '@/types/models';
import { Folder, FolderOpen, GripVertical } from 'lucide-react';

// Mock data
const mockCategories: Category[] = [
  { _id: '1', name: 'Bags & Accessories', slug: 'bags-accessories', description: 'Handbags, wallets, and fashion accessories', order: 1, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-15T10:00:00Z' },
  { _id: '2', name: 'Shoes', slug: 'shoes', description: 'Designer footwear and sneakers', order: 2, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-14T09:00:00Z' },
  { _id: '3', name: 'Dresses', slug: 'dresses', description: 'Evening wear and casual dresses', order: 3, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-13T14:00:00Z' },
  { _id: '4', name: 'Outerwear', slug: 'outerwear', description: 'Coats, jackets, and blazers', order: 4, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-12T11:00:00Z' },
  { _id: '5', name: 'Jewelry & Watches', slug: 'jewelry-watches', description: 'Fine jewelry and luxury timepieces', order: 5, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-11T16:00:00Z' },
  { _id: '6', name: 'Tops', slug: 'tops', description: 'Blouses, shirts, and sweaters', order: 6, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-10T13:00:00Z' },
  { _id: '7', name: 'Bottoms', slug: 'bottoms', description: 'Pants, skirts, and shorts', order: 7, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-09T10:00:00Z' },
  { _id: '8', name: 'Vintage', slug: 'vintage', description: 'Vintage and retro fashion pieces', order: 8, isActive: false, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-08T09:00:00Z' },
];

export default function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const columns: Column<Category>[] = [
    {
      key: 'order',
      header: '',
      className: 'w-12',
      render: () => (
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <GripVertical className="h-4 w-4" />
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Category',
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            {cat.isActive ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{cat.name}</p>
            <p className="text-sm text-muted-foreground">/{cat.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (cat) => (
        <p className="text-muted-foreground truncate max-w-[300px]">{cat.description || '—'}</p>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (cat) => (
        <span className={`text-sm font-medium ${cat.isActive ? 'text-success' : 'text-muted-foreground'}`}>
          {cat.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      render: (cat) => (
        <span className="text-muted-foreground">
          {new Date(cat.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredCategories = mockCategories.filter((cat) => {
    return search === '' || cat.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Categories"
        description="Manage product categories and hierarchy"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search categories..."
        onAdd={() => { setEditingCategory(null); setShowForm(true); }}
        addLabel="Add Category"
      />

      <div className="p-6">
        <DataTable
          data={filteredCategories}
          columns={columns}
          keyExtractor={(cat) => cat._id}
          onEdit={(cat) => { setEditingCategory(cat); setShowForm(true); }}
          onDelete={(cat) => console.log('Delete category:', cat._id)}
        />
      </div>

      {/* Add/Edit Category Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCategory(null); }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={editingCategory?.name} placeholder="Enter category name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" defaultValue={editingCategory?.slug} placeholder="category-slug" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingCategory?.description} placeholder="Enter description" rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active</Label>
            <Switch id="isActive" defaultChecked={editingCategory?.isActive ?? true} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingCategory(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingCategory ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
