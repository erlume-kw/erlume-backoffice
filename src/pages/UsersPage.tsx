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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/models';
import { Mail, Phone, Calendar } from 'lucide-react';

// Mock data
const mockUsers: User[] = [
  { _id: '1', email: 'sarah@example.com', firstName: 'Sarah', lastName: 'Johnson', phone: '+1 555-0101', role: 'user', status: 'active', createdAt: '2024-01-15T10:30:00Z', updatedAt: '2024-01-20T14:00:00Z' },
  { _id: '2', email: 'mike@example.com', firstName: 'Mike', lastName: 'Chen', phone: '+1 555-0102', role: 'admin', status: 'active', createdAt: '2024-01-10T08:00:00Z', updatedAt: '2024-01-18T16:30:00Z' },
  { _id: '3', email: 'emily@example.com', firstName: 'Emily', lastName: 'Davis', role: 'user', status: 'inactive', createdAt: '2024-01-05T12:00:00Z', updatedAt: '2024-01-15T09:00:00Z' },
  { _id: '4', email: 'james@example.com', firstName: 'James', lastName: 'Wilson', phone: '+1 555-0104', role: 'user', status: 'suspended', createdAt: '2024-01-01T14:30:00Z', updatedAt: '2024-01-12T11:00:00Z' },
  { _id: '5', email: 'lisa@example.com', firstName: 'Lisa', lastName: 'Anderson', phone: '+1 555-0105', role: 'user', status: 'active', createdAt: '2023-12-28T16:00:00Z', updatedAt: '2024-01-08T10:00:00Z' },
  { _id: '6', email: 'david@example.com', firstName: 'David', lastName: 'Brown', role: 'user', status: 'active', createdAt: '2023-12-20T09:00:00Z', updatedAt: '2024-01-05T15:30:00Z' },
  { _id: '7', email: 'anna@example.com', firstName: 'Anna', lastName: 'Martinez', phone: '+1 555-0107', role: 'user', status: 'pending', createdAt: '2023-12-15T11:00:00Z', updatedAt: '2024-01-02T14:00:00Z' },
  { _id: '8', email: 'chris@example.com', firstName: 'Chris', lastName: 'Taylor', phone: '+1 555-0108', role: 'admin', status: 'active', createdAt: '2023-12-10T13:30:00Z', updatedAt: '2023-12-30T17:00:00Z' },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <span className={`text-sm font-medium ${user.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (user) => <span className="text-muted-foreground">{user.phone || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (user) => (
        <span className="text-muted-foreground">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = search === '' ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !filters.status || user.status === filters.status;
    const matchesRole = !filters.role || user.role === filters.role;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleFilterChange = (key: string, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Users"
        description="Manage marketplace users and their accounts"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users..."
        onAdd={() => { setEditingUser(null); setShowForm(true); }}
        addLabel="Add User"
      />

      <div className="p-6 space-y-4">
        <FilterBar
          filters={[
            {
              key: 'status',
              label: 'Status',
              value: filters.status,
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'pending', label: 'Pending' },
              ],
            },
            {
              key: 'role',
              label: 'Role',
              value: filters.role,
              options: [
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
              ],
            },
          ]}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
        />

        <DataTable
          data={filteredUsers}
          columns={columns}
          keyExtractor={(user) => user._id}
          onView={(user) => setSelectedUser(user)}
          onEdit={(user) => { setEditingUser(user); setShowForm(true); }}
          onDelete={(user) => console.log('Delete user:', user._id)}
        />
      </div>

      {/* View User Panel */}
      <DetailPanel
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        description={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xl font-semibold text-primary">
                  {selectedUser.firstName[0]}{selectedUser.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h3>
                <StatusBadge status={selectedUser.status} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{selectedUser.email}</span>
              </div>
              {selectedUser.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{selectedUser.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <Button variant="outline" className="w-full" onClick={() => { setEditingUser(selectedUser); setShowForm(true); setSelectedUser(null); }}>
                Edit User
              </Button>
            </div>
          </div>
        )}
      </DetailPanel>

      {/* Add/Edit User Form */}
      <DetailPanel
        open={showForm}
        onClose={() => { setShowForm(false); setEditingUser(null); }}
        title={editingUser ? 'Edit User' : 'Add User'}
        type="dialog"
        size="md"
      >
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowForm(false); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue={editingUser?.firstName} placeholder="Enter first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue={editingUser?.lastName} placeholder="Enter last name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={editingUser?.email} placeholder="Enter email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" defaultValue={editingUser?.phone} placeholder="Enter phone number" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue={editingUser?.role || 'user'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={editingUser?.status || 'active'}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowForm(false); setEditingUser(null); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </div>
        </form>
      </DetailPanel>
    </AdminLayout>
  );
}
