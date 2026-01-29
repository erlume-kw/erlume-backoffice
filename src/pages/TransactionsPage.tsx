import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable, Column } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DetailPanel } from '@/components/common/DetailPanel';
import type { Transaction } from '@/types/models';
import { CreditCard, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

// Mock data
const mockTransactions: Transaction[] = [
  { _id: '1', orderId: 'o1', userId: 'u1', type: 'payment', amount: 327.24, currency: 'USD', status: 'completed', provider: 'stripe', providerTransactionId: 'ch_1234567890', createdAt: '2024-01-20T10:30:00Z', updatedAt: '2024-01-20T10:31:00Z' },
  { _id: '2', orderId: 'o2', userId: 'u2', type: 'payment', amount: 155.35, currency: 'USD', status: 'completed', provider: 'stripe', providerTransactionId: 'ch_0987654321', createdAt: '2024-01-19T08:00:00Z', updatedAt: '2024-01-19T08:01:00Z' },
  { _id: '3', orderId: 'o3', userId: 'u3', type: 'payment', amount: 533.91, currency: 'USD', status: 'pending', provider: 'paypal', providerTransactionId: 'PAY-ABC123', createdAt: '2024-01-18T14:30:00Z', updatedAt: '2024-01-18T14:30:00Z' },
  { _id: '4', orderId: 'o6', userId: 'u6', type: 'refund', amount: 105.63, currency: 'USD', status: 'completed', provider: 'stripe', providerTransactionId: 're_REFUND123', createdAt: '2024-01-19T15:30:00Z', updatedAt: '2024-01-19T15:35:00Z' },
  { _id: '5', orderId: 'o4', userId: 'u4', type: 'payment', amount: 229.72, currency: 'USD', status: 'failed', provider: 'stripe', providerTransactionId: 'ch_FAILED123', createdAt: '2024-01-17T11:00:00Z', updatedAt: '2024-01-17T11:02:00Z' },
  { _id: '6', orderId: 'o1', userId: 's1', type: 'payout', amount: 278.15, currency: 'USD', status: 'completed', provider: 'bank_transfer', createdAt: '2024-01-22T09:00:00Z', updatedAt: '2024-01-22T09:00:00Z' },
  { _id: '7', orderId: 'o7', userId: 'u7', type: 'payment', amount: 1215.00, currency: 'USD', status: 'completed', provider: 'stripe', providerTransactionId: 'ch_PREMIUM123', createdAt: '2024-01-15T08:00:00Z', updatedAt: '2024-01-15T08:02:00Z' },
  { _id: '8', orderId: 'o8', userId: 'u8', type: 'payment', amount: 481.40, currency: 'USD', status: 'completed', provider: 'paypal', providerTransactionId: 'PAY-XYZ789', createdAt: '2024-01-14T17:00:00Z', updatedAt: '2024-01-14T17:01:00Z' },
];

const typeIcons = {
  payment: ArrowDownRight,
  refund: RefreshCw,
  payout: ArrowUpRight,
};

const typeColors = {
  payment: 'text-success',
  refund: 'text-warning',
  payout: 'text-primary',
};

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const columns: Column<Transaction>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (tx) => {
        const Icon = typeIcons[tx.type];
        return (
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg bg-muted ${typeColors[tx.type]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="font-medium capitalize">{tx.type}</span>
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx) => (
        <span className={`font-semibold ${tx.type === 'refund' ? 'text-warning' : tx.type === 'payout' ? 'text-primary' : 'text-success'}`}>
          {tx.type === 'refund' ? '-' : '+'}${tx.amount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (tx) => <StatusBadge status={tx.status} />,
    },
    {
      key: 'provider',
      header: 'Provider',
      render: (tx) => (
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="capitalize">{tx.provider.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'providerTransactionId',
      header: 'Transaction ID',
      render: (tx) => (
        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
          {tx.providerTransactionId || '—'}
        </code>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (tx) => (
        <span className="text-muted-foreground">
          {new Date(tx.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredTransactions = mockTransactions.filter((tx) => {
    return search === '' ||
      tx.providerTransactionId?.toLowerCase().includes(search.toLowerCase()) ||
      tx.type.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <AdminLayout>
      <PageHeader
        title="Transactions"
        description="View payment transactions and payouts"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search transactions..."
      />

      <div className="p-6">
        <DataTable
          data={filteredTransactions}
          columns={columns}
          keyExtractor={(tx) => tx._id}
          onView={(tx) => setSelectedTransaction(tx)}
        />
      </div>

      {/* View Transaction Panel */}
      <DetailPanel
        open={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${typeColors[selectedTransaction.type]}`}>
                {(() => { const Icon = typeIcons[selectedTransaction.type]; return <Icon className="h-6 w-6" />; })()}
              </div>
              <div>
                <h3 className="text-lg font-semibold capitalize">{selectedTransaction.type}</h3>
                <StatusBadge status={selectedTransaction.status} />
              </div>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Amount</p>
              <p className={`text-3xl font-bold ${selectedTransaction.type === 'refund' ? 'text-warning' : 'text-success'}`}>
                {selectedTransaction.type === 'refund' ? '-' : '+'}${selectedTransaction.amount.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{selectedTransaction.currency}</p>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Provider</span>
                <span className="font-medium capitalize">{selectedTransaction.provider.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Transaction ID</span>
                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">{selectedTransaction.providerTransactionId || '—'}</code>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Date</span>
                <span>{new Date(selectedTransaction.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-mono text-sm">{selectedTransaction.orderId}</span>
              </div>
            </div>
          </div>
        )}
      </DetailPanel>
    </AdminLayout>
  );
}
