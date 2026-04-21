'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import { ChevronRight, ChevronDown } from 'lucide-react';

const UserPerformanceCalendar = dynamic(() => import('@/components/admin/UserPerformanceCalendar'), {
  loading: () => <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading calendar...</div></div>,
  ssr: false,
});

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  resetCount?: number;
  _count?: { individualTrades: number; dailySummaries: number; targets: number };
  stats?: {
    totalTrades: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    sopRate: number;
    netProfitLoss: number;
  };
}

interface AccountWithStats {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  startingBalance: number;
  isDefault: boolean;
  createdAt: string;
  stats: {
    totalTrades: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
    sopRate: number;
    grossPnl: number;
    commissionTotal: number;
    netPnl: number;
  };
}

type SortField = 'name' | 'email' | 'winRate' | 'sopRate' | 'netProfitLoss' | 'totalTrades' | 'resetCount';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Expand / accounts state
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [userAccounts, setUserAccounts] = useState<Record<string, AccountWithStats[]>>({});
  const [loadingAccounts, setLoadingAccounts] = useState<Set<string>>(new Set());

  // User-level modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState('');

  // Account-level modals
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [performanceTarget, setPerformanceTarget] = useState<{
    userId: string;
    userName: string;
    accountId: string;
    accountName: string;
  } | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<{
    userId: string;
    accountId: string;
    accountName: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' as 'USER' | 'ADMIN' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      if (result.success && result.data) {
        setUsers(result.data.map((user: any) => ({
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
            winRate: user.winRate / 100,
            sopRate: user.sopRate / 100,
            netProfitLoss: user.netProfitLoss,
          },
          _count: { individualTrades: user.totalTrades, dailySummaries: 0, targets: 0 },
        })));
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

  const fetchUserAccounts = async (userId: string) => {
    setLoadingAccounts((prev) => new Set(prev).add(userId));
    try {
      const res = await fetch(`/api/admin/users/${userId}/accounts`);
      const data = await res.json();
      if (data.success) setUserAccounts((prev) => ({ ...prev, [userId]: data.data }));
    } catch {
      showToast('Failed to load accounts', 'error');
    } finally {
      setLoadingAccounts((prev) => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const toggleUserExpand = async (userId: string) => {
    if (expandedUsers.has(userId)) {
      setExpandedUsers((prev) => { const s = new Set(prev); s.delete(userId); return s; });
      return;
    }
    if (!userAccounts[userId]) await fetchUserAccounts(userId);
    setExpandedUsers((prev) => new Set(prev).add(userId));
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const sortIcon = (field: SortField) => sortField === field ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

  const filteredAndSortedUsers = users
    .filter((u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      let aVal: any, bVal: any;
      if (['winRate', 'sopRate', 'netProfitLoss', 'totalTrades'].includes(sortField)) {
        aVal = a.stats?.[sortField as keyof typeof a.stats] ?? 0;
        bVal = b.stats?.[sortField as keyof typeof b.stats] ?? 0;
      } else if (sortField === 'resetCount') {
        aVal = a.resetCount ?? 0; bVal = b.resetCount ?? 0;
      } else {
        aVal = a[sortField as 'name' | 'email']; bVal = b[sortField as 'name' | 'email'];
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to create user');
      showToast('User created successfully', 'success');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '', role: 'USER' });
      fetchUsers();
    } catch (error: any) { showToast(error.message || 'Failed to create user', 'error'); }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, email: formData.email, role: formData.role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to update user');
      showToast('User updated successfully', 'success');
      setShowEditModal(false); setSelectedUser(null); fetchUsers();
    } catch (error: any) { showToast(error.message || 'Failed to update user', 'error'); }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to delete user');
      showToast('User deleted successfully', 'success');
      setShowDeleteModal(false); setSelectedUser(null); fetchUsers();
    } catch (error: any) { showToast(error.message || 'Failed to delete user', 'error'); }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Failed to reset password');
      setTempPassword(result.data.temporaryPassword);
    } catch (error: any) {
      showToast(error.message || 'Failed to reset password', 'error');
      setShowResetPasswordModal(false); setSelectedUser(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    const { userId, accountId } = accountToDelete;
    try {
      const res = await fetch(`/api/admin/users/${userId}/accounts/${accountId}`, { method: 'DELETE' });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message || 'Failed to delete account');
      showToast('Account deleted', 'success');
      setShowDeleteAccountModal(false);
      setAccountToDelete(null);
      await fetchUserAccounts(userId);
    } catch (error: any) { showToast(error.message || 'Failed to delete account', 'error'); }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role });
    setShowEditModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const RoleBadge = ({ role }: { role: string }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
    }`}>
      {role}
    </span>
  );

  const AccountTypeBadge = ({ type }: { type: string }) => (
    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700">
      {ACCOUNT_TYPE_LABELS[type] ?? type}
    </span>
  );

  if (loading) {
    return <div className="p-8">Loading users...</div>;
  }

  return (
    <div className="p-6">
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

      {/* ── Desktop Table ──────────────────────────────────────────────────── */}
      <Card className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="w-8 px-4 py-3"></th>
              <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('name')}>
                Name{sortIcon('name')}
              </th>
              <th className="text-left px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('email')}>
                Email{sortIcon('email')}
              </th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Account</th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('totalTrades')}>
                Trades{sortIcon('totalTrades')}
              </th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('winRate')}>
                Win Rate{sortIcon('winRate')}
              </th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('sopRate')}>
                SOP Rate{sortIcon('sopRate')}
              </th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('netProfitLoss')}>
                Net P&L{sortIcon('netProfitLoss')}
              </th>
              <th className="text-right px-4 py-3 cursor-pointer hover:bg-gray-100 whitespace-nowrap" onClick={() => handleSort('resetCount')}>
                Data Resets{sortIcon('resetCount')}
              </th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.map((user) => {
              const isExpanded = expandedUsers.has(user.id);
              const isLoadingAcc = loadingAccounts.has(user.id);
              const accounts = userAccounts[user.id] ?? [];

              return (
                <React.Fragment key={user.id}>
                  {/* User row */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserExpand(user.id)}
                        className="text-gray-400 hover:text-gray-700 transition-colors"
                        title={isExpanded ? 'Collapse accounts' : 'Expand accounts'}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {isExpanded ? `${accounts.length} account${accounts.length !== 1 ? 's' : ''}` : ''}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-400">—</td>
                    <td className="text-right px-4 py-3 text-gray-400">—</td>
                    <td className="text-right px-4 py-3 text-gray-400">—</td>
                    <td className="text-right px-4 py-3 text-gray-400">—</td>
                    <td className="text-right px-4 py-3 text-gray-400">—</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>Edit</Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setTempPassword(''); setShowResetPasswordModal(true); }}>
                          Reset Password
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Loading accounts */}
                  {isExpanded && isLoadingAcc && (
                    <tr key={`${user.id}-loading`} className="bg-blue-50/40">
                      <td colSpan={11} className="px-8 py-3 text-xs text-gray-500">Loading accounts…</td>
                    </tr>
                  )}

                  {/* No accounts */}
                  {isExpanded && !isLoadingAcc && accounts.length === 0 && (
                    <tr key={`${user.id}-empty`} className="bg-gray-50/60">
                      <td colSpan={11} className="px-8 py-3 text-xs text-gray-400 italic">No trading accounts found</td>
                    </tr>
                  )}

                  {/* Account sub-rows */}
                  {isExpanded && !isLoadingAcc && accounts.map((acc) => (
                    <tr key={acc.id} className="bg-blue-50/30 border-b border-blue-100">
                      <td className="px-4 py-2.5 text-gray-300 text-xs pl-6">└</td>
                      <td className="px-4 py-2.5" colSpan={2}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800">{acc.name}</span>
                          <AccountTypeBadge type={acc.accountType} />
                          {acc.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5"></td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{acc.currency}</td>
                      <td className="text-right px-4 py-2.5 font-medium">{acc.stats.totalTrades}</td>
                      <td className={`text-right px-4 py-2.5 font-medium ${acc.stats.winRate >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                        {acc.stats.winRate.toFixed(1)}%
                      </td>
                      <td className={`text-right px-4 py-2.5 font-medium ${acc.stats.sopRate >= 80 ? 'text-blue-700' : 'text-yellow-700'}`}>
                        {acc.stats.sopRate.toFixed(1)}%
                      </td>
                      <td className={`text-right px-4 py-2.5 font-medium ${acc.stats.netPnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {acc.stats.netPnl >= 0 ? '+' : ''}${acc.stats.netPnl.toFixed(2)}
                      </td>
                      <td className="text-right px-4 py-2.5">
                        {(user.resetCount ?? 0) > 0 ? (
                          <span className="font-semibold text-sm text-orange-600" title="Times user reset all trading data">
                            {user.resetCount}x
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          {user.role !== 'ADMIN' && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-2"
                              onClick={() => {
                                setPerformanceTarget({ userId: user.id, userName: user.name, accountId: acc.id, accountName: acc.name });
                                setShowPerformanceModal(true);
                              }}
                            >
                              📊 Performance
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              setAccountToDelete({ userId: user.id, accountId: acc.id, accountName: acc.name });
                              setShowDeleteAccountModal(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* ── Mobile Card View ───────────────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {filteredAndSortedUsers.map((user) => {
          const isExpanded = expandedUsers.has(user.id);
          const isLoadingAcc = loadingAccounts.has(user.id);
          const accounts = userAccounts[user.id] ?? [];

          return (
            <Card key={user.id} className="overflow-hidden">
              {/* User header — tap to expand */}
              <div
                className="p-4 cursor-pointer flex items-start gap-3 hover:bg-gray-50 transition-colors"
                onClick={() => toggleUserExpand(user.id)}
              >
                <div className="mt-0.5 text-gray-400 shrink-0">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{user.name}</span>
                    <RoleBadge role={user.role} />
                    {(user.resetCount ?? 0) > 0 && (
                      <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded" title="Times user reset all trading data">
                        {user.resetCount}x data reset
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{user.email}</p>
                </div>
              </div>

              {/* User actions */}
              <div className="px-4 pb-3 flex flex-wrap gap-2 border-t pt-3">
                <Button size="sm" variant="outline" onClick={() => openEditModal(user)} className="text-xs">Edit</Button>
                <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setTempPassword(''); setShowResetPasswordModal(true); }} className="text-xs">
                  Reset Password
                </Button>
                <Button size="sm" variant="destructive" onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }} className="text-xs">
                  Delete User
                </Button>
              </div>

              {/* Account sub-cards */}
              {isExpanded && (
                <div className="border-t bg-blue-50/30">
                  {isLoadingAcc && <div className="px-4 py-3 text-xs text-gray-500">Loading accounts…</div>}
                  {!isLoadingAcc && accounts.length === 0 && <div className="px-4 py-3 text-xs text-gray-400 italic">No trading accounts</div>}
                  {!isLoadingAcc && accounts.map((acc) => (
                    <div key={acc.id} className="border-t border-blue-100 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-800">{acc.name}</span>
                        <AccountTypeBadge type={acc.accountType} />
                        {acc.isDefault && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Default</span>}
                        {(user.resetCount ?? 0) > 0 && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded" title="Times user reset all trading data">
                            {user.resetCount}x data reset
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="bg-white p-2 rounded border">
                          <div className="text-gray-500">Trades</div>
                          <div className="font-semibold">{acc.stats.totalTrades}</div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="text-gray-500">Win Rate</div>
                          <div className={`font-semibold ${acc.stats.winRate >= 50 ? 'text-green-700' : 'text-red-600'}`}>
                            {acc.stats.winRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="text-gray-500">SOP Rate</div>
                          <div className={`font-semibold ${acc.stats.sopRate >= 80 ? 'text-blue-700' : 'text-yellow-700'}`}>
                            {acc.stats.sopRate.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <div className="text-gray-500">Net P&L</div>
                          <div className={`font-semibold ${acc.stats.netPnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                            {acc.stats.netPnl >= 0 ? '+' : ''}${acc.stats.netPnl.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.role !== 'ADMIN' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                            onClick={() => {
                              setPerformanceTarget({ userId: user.id, userName: user.name, accountId: acc.id, accountName: acc.name });
                              setShowPerformanceModal(true);
                            }}
                          >
                            📊 Performance
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          className="text-xs"
                          onClick={() => {
                            setAccountToDelete({ userId: user.id, accountId: acc.id, accountName: acc.name });
                            setShowDeleteAccountModal(true);
                          }}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Create User */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Create New User</h2>
            <form onSubmit={handleCreateUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="create-name">Name</Label>
                  <Input id="create-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required minLength={2} maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="create-email">Email</Label>
                  <Input id="create-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="create-password">Password</Label>
                  <Input id="create-password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
                </div>
                <div>
                  <Label htmlFor="create-role">Role</Label>
                  <select id="create-role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })} className="w-full p-2 border rounded">
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

      {/* Edit User */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input id="edit-name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required minLength={2} maxLength={50} />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <select id="edit-role" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })} className="w-full p-2 border rounded">
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <Button type="submit" className="flex-1">Update User</Button>
                <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setSelectedUser(null); }} className="flex-1">Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete User */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete User</h2>
            <p className="mb-2">Delete <strong>{selectedUser.name}</strong> and all their data?</p>
            <p className="text-sm text-gray-600 mb-6">This permanently deletes all accounts, trades, summaries, and targets. Cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteUser} className="flex-1">Delete User</Button>
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setSelectedUser(null); }} className="flex-1">Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reset Password */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            {!tempPassword ? (
              <>
                <p className="mb-6">Generate a temporary password for <strong>{selectedUser.name}</strong>?</p>
                <div className="flex gap-2">
                  <Button onClick={handleResetPassword} className="flex-1">Generate Password</Button>
                  <Button variant="outline" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); }} className="flex-1">Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-4">Temporary password generated:</p>
                <div className="bg-gray-100 p-4 rounded mb-4 font-mono text-lg text-center">{tempPassword}</div>
                <p className="text-sm text-gray-600 mb-6">Share this securely. The user should change it after logging in.</p>
                <div className="flex gap-2">
                  <Button onClick={() => copyToClipboard(tempPassword)} className="flex-1">Copy Password</Button>
                  <Button variant="outline" onClick={() => { setShowResetPasswordModal(false); setSelectedUser(null); setTempPassword(''); }} className="flex-1">Close</Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Delete Account */}
      {showDeleteAccountModal && accountToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Account</h2>
            <p className="mb-2">Delete account <strong>{accountToDelete.accountName}</strong>?</p>
            <p className="text-sm text-gray-600 mb-6">This permanently deletes all trades, summaries, and rules for this account. Cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteAccount} className="flex-1">Delete Account</Button>
              <Button variant="outline" onClick={() => { setShowDeleteAccountModal(false); setAccountToDelete(null); }} className="flex-1">Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Performance Calendar (per account) */}
      {showPerformanceModal && performanceTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-7xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">Performance</h2>
                <p className="text-sm text-gray-500">{performanceTarget.userName} · {performanceTarget.accountName}</p>
              </div>
              <Button variant="outline" onClick={() => { setShowPerformanceModal(false); setPerformanceTarget(null); }}>
                Close
              </Button>
            </div>
            <UserPerformanceCalendar
              userId={performanceTarget.userId}
              userName={performanceTarget.userName}
              accountId={performanceTarget.accountId}
              accountName={performanceTarget.accountName}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
