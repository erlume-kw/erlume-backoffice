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
import type { Outfit } from '@/types/models';
import { Shirt, Heart, Eye, Globe, Lock } from 'lucide-react';

// Mock data
const mockOutfits: Outfit[] = [
  { _id: '1', userId: 'u1', name: 'Summer Vibes', description: 'Perfect casual summer look', likes: 156, isPublic: true, createdAt: '2024-01-20T10:30:00Z', updatedAt: '2024-01-20T14:00:00Z' },
  { _id: '2', userId: 'u2', name: 'Business Casual', description: 'Office-ready ensemble', likes: 89, isPublic: true, createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-19T16:30:00Z' },
  { _id: '3', userId: 'u3', name: 'Date Night', description: 'Elegant evening outfit', likes: 234, isPublic: true, createdAt: '2024-01-18T14:30:00Z', updatedAt: '2024-01-18T18:00:00Z' },
  { _id: '4', userId: 'u4', name: 'Weekend Brunch', description: 'Relaxed weekend style', likes: 67, isPublic: false, createdAt: '2024-01-17T11:00:00Z', updatedAt: '2024-01-17T12:00:00Z' },
  { _id: '5', userId: 'u5', name: 'Street Style', description: 'Urban streetwear inspiration', likes: 312, isPublic: true, createdAt: '2024-01-16T16:00:00Z', updatedAt: '2024-01-16T20:00:00Z' },
  { _id: '6', userId: 'u6', name: 'Minimalist Look', description: 'Clean and simple aesthetic', likes: 145, isPublic: true, createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-15T15:30:00Z' },
];

export default function OutfitsPage() {
  const [search, setSearch] = useState('');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);

  const columns: Column<Outfit>[] = [
    {
      key: 'name',
      header: 'Outfit',
      render: (outfit) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shirt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{outfit.name}</p>
            <p className="text-sm text-muted-foreground truncate max-w-[200px]">{outfit.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (outfit) => (
        <div className="flex items-center gap-2">
          {outfit.isPublic ? (
            <>
              <Globe className="h-4 w-4 text-success" />
              <span className="text-success text-sm">Public</span>
            </>
          ) : (
            <>
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Private</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'likes',
      header: 'Likes',
      render: (outfit) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Heart className="h-4 w-4" />
          <span>{outfit.likes}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (outfit) => (
        <span className="text-muted-foreground">
          {new Date(outfit.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredOutfits = mockOutfits.filter((outfit) => {
    return search === '' || outfit.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Outfits"
        description="Manage user-created outfit collections"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search outfits..."
        onAdd={() => { setEditingOutfit(null); setShowForm(true); }}
        addLabel="Create Outfit"
      />

      <div className="p-6">
        <DataTable
          data={filteredOutfits}
          columns={columns}
          keyExtractor={(outfit) => outfit._id}
          onView={(outfit) => setSelectedOutfit(outfit)}
          onEdit={(outfit) => { setEditingOutfit(outfit); setShowForm(true); }}
          onDelete={(outfit) => console.log('Delete outfit:', outfit._id)}
        />
      </div>

      {/* View Outfit Panel */}
      <DetailPanel
        open={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
        title="Outfit Details"
        description={selectedOutfit?.name}
      >
        {selectedOutfit && (
          <div className="space-y-6">
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <Shirt className="h-16 w-16 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{selectedOutfit.name}</h3>
              <div className="flex items-center gap-2">
                {selectedOutfit.isPublic ? (
                  <Globe className="h-4 w-4 text-success" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            <p className="text-muted-foreground">{selectedOutfit.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-muted-foreground">Likes</span>
                </div>
                <p className="text-lg font-semibold">{selectedOutfit.likes}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Items</span>
                </div>
                <p className="text-lg font-semibold">—</p>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => { setEditingOutfit(selectedOutfit); setShowForm(true); setSelectedOutfit(null); }}>
              Edit Outfit
            </Button>
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit Outfit Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingOutfit(null); }}
        title={editingOutfit ? 'Edit Outfit' : 'Create Outfit'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue={editingOutfit?.name} placeholder="Enter outfit name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" defaultValue={editingOutfit?.description} placeholder="Enter description" rows={3} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="isPublic">Public</Label>
            <Switch id="isPublic" defaultChecked={editingOutfit?.isPublic ?? true} />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingOutfit(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingOutfit ? 'Save Changes' : 'Create Outfit'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
