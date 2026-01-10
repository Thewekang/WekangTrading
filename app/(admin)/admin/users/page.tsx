'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import UserPerformanceCalendar from '@/components/admin/UserPerformanceCalendar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  resetCount?: number;
  _count?: {
    individualTrades: number;
    dailySummaries: number;
    targets: number;
  };
  stats?: {
    totalTrades: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    sopRate: number;
    netProfitLoss: number;
  };
}

type SortField = 'name' | 'email' | 'winRate' | 'sopRate' | 'netProfitLoss' | 'totalTrades' | 'resetCount';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      
      // API returns { success, data: [users] }
      if (result.success && result.data) {
        // Transform API response to match expected User interface
        const formattedUsers = result.data.map((user: any) => ({
          id: user.userId,
          name: user.userName,
          email: user.userEmail,
          role: user.userRole,
          resetCount: user.resetCount || 0,
          createdAt: user.createdAt,
          stats: {
            totalTrades: user.totalTrades,
            totalWins: user.totalWins,
            totalLosses: user.totalLosses,
            winRate: user.winRate / 100, // API returns percentage, convert to decimal
            sopRate: user.sopRate / 100, // API returns percentage, convert to decimal
            netProfitLoss: user.netProfitLoss,
          },
          _count: {
            individualTrades: user.totalTrades,
            dailySummaries: 0,
            targets: 0,
          }
        }));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      if (sortField === 'winRate' || sortField === 'sopRate' || sortField === 'netProfitLoss' || sortField === 'totalTrades') {
        aValue = a.stats?.[sortField] ?? 0;
        bValue = b.stats?.[sortField] ?? 0;
      } else if (sortField === 'resetCount') {
        aValue = a.resetCount ?? 0;
        bValue = b.resetCount ?? 0;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create user');
      }

      showToast('User created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to create user', 'error');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update user');
      }

      showToast('User updated successfully', 'success');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete user');
      }

      showToast('User deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete user', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to reset password');
      }

      setTempPassword(result.data.temporaryPassword);
    } catch (error: any) {
      showToast(error.message || 'Failed to reset password', 'error');
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openResetPasswordModal = (user: User) => {
    setSelectedUser(user);
    setTempPassword('');
    setShowResetPasswordModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  if (loading) {
    return <div className="p-8">Loading users...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>Create User</Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('email')}>
                Email {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-4">Role</th>
              <th className="text-right p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('totalTrades')}>
                Trades {sortField === 'totalTrades' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('winRate')}>
                Win Rate {sortField === 'winRate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('sopRate')}>
                SOP Rate {sortField === 'sopRate' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-4 cursor-pointer hover:bg-gray-50" onClick={() => handleSort('netProfitLoss')}>
                Net P&L {sortField === 'netProfitLoss' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right p-4 cursor-pointer" onClick={() => handleSort('resetCount')}>
                Resets {sortField === 'resetCount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50">
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="text-right p-4">{user.stats?.totalTrades ?? 0}</td>
                <td className="text-right p-4">{((user.stats?.winRate ?? 0) * 100).toFixed(1)}%</td>
                <td className="text-right p-4">{((user.stats?.sopRate ?? 0) * 100).toFixed(1)}%</td>
                <td className={`text-right p-4 ${(user.stats?.netProfitLoss ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(user.stats?.netProfitLoss ?? 0).toFixed(2)}
                </td>
                <td className="text-right p-4">
                  <span className={`font-semibold ${(user.resetCount ?? 0) > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                    {user.resetCount ?? 0}x
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    {user.role !== 'ADMIN' && (
                      <Button 
                        size="sm" 
                        variant="default" 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowPerformanceModal(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        📊 Performance
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => openResetPasswordModal(user)}>Reset Password</Button>
                    <Button size="sm" variant="destructive" onClick={() => openDeleteModal(user)}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Name</Label>
                  <Input
                    id="create-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="create-password">Password</Label>
                  <Input
                    id="create-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="create-role">Role</Label>
                  <select
                    id="create-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">Create User</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    minLength={2}
                    maxLength={50}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <select
                    id="edit-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                    className="w-full p-2 border rounded"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">Update User</Button>
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete User</h2>
            <p className="mb-4">Are you sure you want to delete <strong>{selectedUser.name}</strong>?</p>
            <p className="text-sm text-gray-600 mb-6">This will permanently delete:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6">
              <li>{selectedUser.stats?.totalTrades ?? 0} trades</li>
              <li>{selectedUser._count?.dailySummaries ?? 0} daily summaries</li>
              <li>{selectedUser._count?.targets ?? 0} targets</li>
            </ul>
            <p className="text-sm font-bold text-red-600 mb-6">This action cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteUser} className="flex-1">Delete User</Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            {!tempPassword ? (
              <>
                <p className="mb-6">
                  Generate a temporary password for <strong>{selectedUser.name}</strong>?
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleResetPassword} className="flex-1">Generate Password</Button>
                  <Button variant="outline" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); }} className="flex-1">Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4">Temporary password generated:</p>
                <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-lg text-center">
                  {tempPassword}
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Copy this password and share it with the user securely. They should change it after logging in.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(tempPassword)} className="flex-1">Copy Password</Button>
                  <Button variant="outline" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setTempPassword(''); }} className="flex-1">Close</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Performance Modal */}
      {showPerformanceModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">User Performance</h2>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPerformanceModal(false);
                  setSelectedUser(null);
                }}
              >
                Close
              </Button>
            </div>
            <UserPerformanceCalendar 
              userId={selectedUser.id} 
              userName={selectedUser.name} 
            />
          </Card>
        </div>
      )}
    </div>
  );
}
