import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FilterBar } from '@/components/common/FilterBar';
import { DetailPanel } from '@/components/common/DetailPanel';
import type { Review } from '@/types/models';
import { Star, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data
const mockReviews: Review[] = [
  { _id: '1', userId: 'u1', itemId: 'i1', orderId: 'o1', rating: 5, title: 'Amazing quality!', comment: 'The bag is exactly as described. Beautiful condition and fast shipping!', status: 'approved', createdAt: '2024-01-20T10:30:00Z', updatedAt: '2024-01-20T12:00:00Z' },
  { _id: '2', userId: 'u2', sellerId: 's1', orderId: 'o2', rating: 4, title: 'Great seller', comment: 'Very responsive seller and authentic items. Would buy again.', status: 'approved', createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-19T10:00:00Z' },
  { _id: '3', userId: 'u3', itemId: 'i3', orderId: 'o3', rating: 3, title: 'Good but...', comment: 'Item is nice but took longer to ship than expected.', status: 'pending', createdAt: '2024-01-18T14:30:00Z', updatedAt: '2024-01-18T14:30:00Z' },
  { _id: '4', userId: 'u4', itemId: 'i4', orderId: 'o4', rating: 5, title: 'Perfect condition', comment: 'Looks brand new! Very happy with my purchase.', status: 'approved', createdAt: '2024-01-17T11:00:00Z', updatedAt: '2024-01-17T13:00:00Z' },
  { _id: '5', userId: 'u5', itemId: 'i5', orderId: 'o5', rating: 1, title: 'Not as described', comment: 'The item had significant wear not shown in photos. Very disappointed.', status: 'pending', createdAt: '2024-01-16T16:00:00Z', updatedAt: '2024-01-16T16:00:00Z' },
  { _id: '6', userId: 'u6', sellerId: 's2', orderId: 'o6', rating: 2, title: 'Poor communication', comment: 'Seller took forever to respond to questions.', status: 'rejected', createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
  { _id: '7', userId: 'u7', itemId: 'i7', orderId: 'o7', rating: 5, title: 'Exceeded expectations', comment: 'This watch is stunning. Authentication certificate included. 10/10!', status: 'approved', createdAt: '2024-01-14T13:30:00Z', updatedAt: '2024-01-14T15:00:00Z' },
];

export default function ReviewsPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const columns: Column<Review>[] = [
    {
      key: 'rating',
      header: 'Rating',
      render: (review) => renderStars(review.rating),
    },
    {
      key: 'content',
      header: 'Review',
      render: (review) => (
        <div className="max-w-[300px]">
          {review.title && <p className="font-medium text-foreground">{review.title}</p>}
          <p className="text-sm text-muted-foreground truncate">{review.comment}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (review) => (
        <span className="text-sm text-muted-foreground">
          {review.itemId ? 'Item' : 'Seller'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (review) => <StatusBadge status={review.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (review) => (
        <span className="text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredReviews = mockReviews.filter((review) => {
    const matchesSearch = search === '' ||
      review.title?.toLowerCase().includes(search.toLowerCase()) ||
      review.comment.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || review.status === filters.status;
    const matchesRating = !filters.rating || review.rating === parseInt(filters.rating);
    return matchesSearch && matchesStatus && matchesRating;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Reviews"
        description="Moderate and manage customer reviews"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search reviews..."
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
                { value: 'rejected', label: 'Rejected' },
              ],
            },
            {
              key: 'rating',
              label: 'Rating',
              value: filters.rating,
              options: [
                { value: '5', label: '5 Stars' },
                { value: '4', label: '4 Stars' },
                { value: '3', label: '3 Stars' },
                { value: '2', label: '2 Stars' },
                { value: '1', label: '1 Star' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters({})}
        />

        <DataTable
          data={filteredReviews}
          columns={columns}
          keyExtractor={(review) => review._id}
          onView={(review) => setSelectedReview(review)}
        />
      </div>

      {/* View Review Panel */}
      <DetailPanel
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Review Details"
      >
        {selectedReview && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {renderStars(selectedReview.rating)}
              <StatusBadge status={selectedReview.status} />
            </div>
            {selectedReview.title && (
              <h3 className="text-lg font-semibold">{selectedReview.title}</h3>
            )}
            <p className="text-muted-foreground">{selectedReview.comment}</p>
            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-mono">{selectedReview.userId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedReview.itemId ? 'Item ID:' : 'Seller ID:'}
                </span>
                <span className="font-mono">{selectedReview.itemId || selectedReview.sellerId}</span>
              </div>
            </div>
            {selectedReview.status === 'pending' && (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 text-success border-success hover:bg-success/10">
                  Approve
                </Button>
                <Button variant="outline" className="flex-1 text-destructive border-destructive hover:bg-destructive/10">
                  Reject
                </Button>
              </div>
            )}
          </div>
        )}
      </DetailPanel>
    </AdminLayout>
  );
}
