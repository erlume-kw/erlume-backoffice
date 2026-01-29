import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FilterBar } from '@/components/common/FilterBar';
import { DetailPanel } from '@/components/common/DetailPanel';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types/models';
import { Package, MapPin, Calendar, User } from 'lucide-react';

// Mock data
const mockOrders: Order[] = [
  { _id: '1', userId: 'u1', orderNumber: 'ORD-2024-001', status: 'delivered', subtotal: 289.99, discount: 0, shipping: 12.99, tax: 24.26, total: 327.24, shippingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' }, billingAddress: { street: '123 Main St', city: 'New York', state: 'NY', postalCode: '10001', country: 'USA' }, createdAt: '2024-01-20T10:30:00Z', updatedAt: '2024-01-22T14:00:00Z' },
  { _id: '2', userId: 'u2', orderNumber: 'ORD-2024-002', status: 'shipped', subtotal: 149.00, discount: 15.00, shipping: 9.99, tax: 11.36, total: 155.35, shippingAddress: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' }, billingAddress: { street: '456 Oak Ave', city: 'Los Angeles', state: 'CA', postalCode: '90001', country: 'USA' }, createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-21T16:30:00Z' },
  { _id: '3', userId: 'u3', orderNumber: 'ORD-2024-003', status: 'processing', subtotal: 542.50, discount: 50.00, shipping: 0, tax: 41.41, total: 533.91, shippingAddress: { street: '789 Pine Rd', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' }, billingAddress: { street: '789 Pine Rd', city: 'Chicago', state: 'IL', postalCode: '60601', country: 'USA' }, createdAt: '2024-01-18T14:30:00Z', updatedAt: '2024-01-20T09:00:00Z' },
  { _id: '4', userId: 'u4', orderNumber: 'ORD-2024-004', status: 'pending', subtotal: 198.00, discount: 0, shipping: 14.99, tax: 16.73, total: 229.72, shippingAddress: { street: '321 Elm St', city: 'Houston', state: 'TX', postalCode: '77001', country: 'USA' }, billingAddress: { street: '321 Elm St', city: 'Houston', state: 'TX', postalCode: '77001', country: 'USA' }, createdAt: '2024-01-17T11:00:00Z', updatedAt: '2024-01-17T11:00:00Z' },
  { _id: '5', userId: 'u5', orderNumber: 'ORD-2024-005', status: 'cancelled', subtotal: 376.25, discount: 25.00, shipping: 12.99, tax: 29.14, total: 393.38, shippingAddress: { street: '654 Maple Dr', city: 'Phoenix', state: 'AZ', postalCode: '85001', country: 'USA' }, billingAddress: { street: '654 Maple Dr', city: 'Phoenix', state: 'AZ', postalCode: '85001', country: 'USA' }, createdAt: '2024-01-16T16:00:00Z', updatedAt: '2024-01-18T10:00:00Z' },
  { _id: '6', userId: 'u6', orderNumber: 'ORD-2024-006', status: 'refunded', subtotal: 89.99, discount: 0, shipping: 7.99, tax: 7.65, total: 105.63, shippingAddress: { street: '987 Cedar Ln', city: 'Philadelphia', state: 'PA', postalCode: '19101', country: 'USA' }, billingAddress: { street: '987 Cedar Ln', city: 'Philadelphia', state: 'PA', postalCode: '19101', country: 'USA' }, createdAt: '2024-01-15T09:00:00Z', updatedAt: '2024-01-19T15:30:00Z' },
  { _id: '7', userId: 'u7', orderNumber: 'ORD-2024-007', status: 'confirmed', subtotal: 1250.00, discount: 125.00, shipping: 0, tax: 90.00, total: 1215.00, shippingAddress: { street: '147 Birch Ave', city: 'San Antonio', state: 'TX', postalCode: '78201', country: 'USA' }, billingAddress: { street: '147 Birch Ave', city: 'San Antonio', state: 'TX', postalCode: '78201', country: 'USA' }, createdAt: '2024-01-14T13:30:00Z', updatedAt: '2024-01-15T08:00:00Z' },
  { _id: '8', userId: 'u8', orderNumber: 'ORD-2024-008', status: 'delivered', subtotal: 425.75, discount: 0, shipping: 19.99, tax: 35.66, total: 481.40, shippingAddress: { street: '258 Walnut St', city: 'San Diego', state: 'CA', postalCode: '92101', country: 'USA' }, billingAddress: { street: '258 Walnut St', city: 'San Diego', state: 'CA', postalCode: '92101', country: 'USA' }, createdAt: '2024-01-13T10:30:00Z', updatedAt: '2024-01-17T14:00:00Z' },
];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'Order',
      render: (order) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{order.orderNumber}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'items',
      header: 'Items',
      render: () => <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (order) => <span className="text-muted-foreground">${order.subtotal.toFixed(2)}</span>,
    },
    {
      key: 'discount',
      header: 'Discount',
      render: (order) => (
        <span className={order.discount > 0 ? 'text-success' : 'text-muted-foreground'}>
          {order.discount > 0 ? `-$${order.discount.toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => <span className="font-semibold text-foreground">${order.total.toFixed(2)}</span>,
    },
  ];

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = search === '' || order.orderNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || order.status === filters.status;
    return matchesSearch && matchesStatus;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Orders"
        description="Track and manage customer orders"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search orders..."
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
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'processing', label: 'Processing' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'cancelled', label: 'Cancelled' },
                { value: 'refunded', label: 'Refunded' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={() => setFilters({})}
        />

        <DataTable
          data={filteredOrders}
          columns={columns}
          keyExtractor={(order) => order._id}
          onView={(order) => setSelectedOrder(order)}
        />
      </div>

      {/* View Order Panel */}
      <DetailPanel
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Order Details"
        description={selectedOrder?.orderNumber}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{selectedOrder.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                </p>
              </div>
              <StatusBadge status={selectedOrder.status} />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Shipping Address</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}<br />
                    {selectedOrder.shippingAddress.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Order Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{selectedOrder.shipping > 0 ? `$${selectedOrder.shipping.toFixed(2)}` : 'Free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${selectedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold">
                  <span>Total</span>
                  <span>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">Update Status</Button>
              <Button variant="destructive" className="flex-1">Cancel Order</Button>
            </div>
          </div>
        )}
      </DetailPanel>
    </AdminLayout>
  );
}
