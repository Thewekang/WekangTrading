'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';

interface Trade {
  id: string;
  tradeTimestamp: string;
  result: 'WIN' | 'LOSS';
  marketSession: 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';
  sopFollowed: boolean;
  profitLossUsd: number;
  notes: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0
  });

  // Filters
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedResult, setSelectedResult] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Users list for filter
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [pagination.page, selectedUserId, selectedResult, selectedSession, dateFrom, dateTo, searchQuery]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API response to simple user list for dropdown
        const userList = result.data.map((user: any) => ({
          id: user.userId,
          name: user.userName,
          email: user.userEmail,
        }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString()
      });

      if (selectedUserId) params.append('userId', selectedUserId);
      if (selectedResult) params.append('result', selectedResult);
      if (selectedSession) params.append('session', selectedSession);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/trades?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch trades');
      
      const data = await response.json();
      setTrades(data.data.trades);
      setPagination(data.data.pagination);
    } catch (error) {
      console.error('Error fetching trades:', error);
      showToast('Failed to load trades', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrade = async () => {
    if (!selectedTrade) return;

    try {
      const response = await fetch(`/api/admin/trades/${selectedTrade.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete trade');
      }

      showToast('Trade deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedTrade(null);
      fetchTrades();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete trade', 'error');
    }
  };

  const openDeleteModal = (trade: Trade) => {
    setSelectedTrade(trade);
    setShowDeleteModal(true);
  };

  const resetFilters = () => {
    setSelectedUserId('');
    setSelectedResult('');
    setSelectedSession('');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setPagination({ ...pagination, page: 1 });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">All Trades</h1>
        <div className="text-sm text-gray-600">
          Total: {pagination.total} trades
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="filter-user">User</Label>
            <select
              id="filter-user"
              value={selectedUserId}
              onChange={(e) => { setSelectedUserId(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="w-full p-2 border rounded"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="filter-result">Result</Label>
            <select
              id="filter-result"
              value={selectedResult}
              onChange={(e) => { setSelectedResult(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="w-full p-2 border rounded"
            >
              <option value="">All Results</option>
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
            </select>
          </div>

          <div>
            <Label htmlFor="filter-session">Session</Label>
            <select
              id="filter-session"
              value={selectedSession}
              onChange={(e) => { setSelectedSession(e.target.value); setPagination({ ...pagination, page: 1 }); }}
              className="w-full p-2 border rounded"
            >
              <option value="">All Sessions</option>
              <option value="ASIA">Asia</option>
              <option value="EUROPE">Europe</option>
              <option value="US">US</option>
              <option value="OVERLAP">Overlap</option>
            </select>
          </div>

          <div>
            <Label htmlFor="filter-date-from">Date From</Label>
            <Input
              id="filter-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            />
          </div>

          <div>
            <Label htmlFor="filter-date-to">Date To</Label>
            <Input
              id="filter-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            />
          </div>

          <div>
            <Label htmlFor="filter-search">Search</Label>
            <Input
              id="filter-search"
              type="text"
              placeholder="Name, email, or notes..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPagination({ ...pagination, page: 1 }); }}
            />
          </div>
        </div>

        <Button onClick={resetFilters} variant="outline" size="sm">Reset Filters</Button>
      </Card>

      {/* Trades Table */}
      {loading ? (
        <div className="text-center py-8">Loading trades...</div>
      ) : trades.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No trades found matching your filters.
        </Card>
      ) : (
        <>
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Date/Time</th>
                  <th className="text-left p-4">Session</th>
                  <th className="text-left p-4">Result</th>
                  <th className="text-center p-4">SOP</th>
                  <th className="text-right p-4">P&L (USD)</th>
                  <th className="text-left p-4">Notes</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{trade.user.name}</div>
                        <div className="text-xs text-gray-500">{trade.user.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{formatTimestamp(trade.tradeTimestamp)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        trade.marketSession === 'ASIA' ? 'bg-yellow-100 text-yellow-800' :
                        trade.marketSession === 'EUROPE' ? 'bg-blue-100 text-blue-800' :
                        trade.marketSession === 'US' ? 'bg-purple-100 text-purple-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {trade.marketSession}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        trade.result === 'WIN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trade.result}
                      </span>
                    </td>
                    <td className="text-center p-4">
                      {trade.sopFollowed ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-red-600">✗</span>
                      )}
                    </td>
                    <td className={`text-right p-4 font-medium ${
                      trade.profitLossUsd >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${trade.profitLossUsd.toFixed(2)}
                    </td>
                    <td className="p-4 max-w-xs truncate text-sm text-gray-600">
                      {trade.notes || '-'}
                    </td>
                    <td className="p-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openDeleteModal(trade)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} trades
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                variant="outline"
              >
                Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
              </div>
              <Button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Trade</h2>
            <p className="mb-4">Are you sure you want to delete this trade?</p>
            <div className="bg-gray-100 p-4 rounded mb-4 text-sm">
              <div><strong>User:</strong> {selectedTrade.user.name}</div>
              <div><strong>Date:</strong> {formatTimestamp(selectedTrade.tradeTimestamp)}</div>
              <div><strong>Result:</strong> {selectedTrade.result}</div>
              <div><strong>P&L:</strong> ${selectedTrade.profitLossUsd.toFixed(2)}</div>
            </div>
            <p className="text-sm font-bold text-red-600 mb-6">
              This will update the user's daily summary. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteTrade} className="flex-1">Delete Trade</Button>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1">Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
