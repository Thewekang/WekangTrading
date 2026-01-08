'use client';

/**
 * Trade List Client Component
 * Handles filtering, pagination, and display of trades
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Trade {
  id: string;
  tradeTimestamp: Date;
  result: string;
  sopFollowed: boolean;
  profitLossUsd: number;
  marketSession: string;
  notes: string | null;
}

interface TradesListProps {
  initialTrades: Trade[];
  userId: string;
}

export function TradesList({ initialTrades, userId }: TradesListProps) {
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [sopFilter, setSopFilter] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTrades.length);
  const [pageSize, setPageSize] = useState(50);
  
  // Load pageSize from localStorage on mount
  useEffect(() => {
    const savedPageSize = localStorage.getItem('tradesPageSize');
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10));
    }
  }, []);
  
  // Save pageSize to localStorage when changed
  useEffect(() => {
    localStorage.setItem('tradesPageSize', pageSize.toString());
  }, [pageSize]);
  
  // Save pageSize to localStorage when changed
  useEffect(() => {
    localStorage.setItem('tradesPageSize', pageSize.toString());
  }, [pageSize]);

  // Helper function to format date/time
  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper function to get session badge
  const getSessionBadge = (session: string) => {
    const badges = {
      ASIA: '🌏 Asia',
      EUROPE: '🇪🇺 Europe',
      US: '🇺🇸 US',
      OVERLAP: '🔄 Overlap',
    };
    return badges[session as keyof typeof badges] || session;
  };

  // Apply filters
  const handleApplyFilters = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (resultFilter) params.append('result', resultFilter);
      if (sessionFilter) params.append('marketSession', sessionFilter);
      if (sopFilter) params.append('sopFollowed', sopFilter);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/trades/individual?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTrades(data.data.trades);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch filtered trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setResultFilter('');
    setSessionFilter('');
    setSopFilter('');
    setCurrentPage(1);
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('pageSize', pageSize.toString());
      
      const response = await fetch(`/api/trades/individual?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTrades(data.data.trades);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handleApplyFilters(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleApplyFilters(currentPage + 1);
    }
  };
  
  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    // Re-fetch with new page size
    setTimeout(() => handleApplyFilters(1), 0);
  };

  // Calculate summary stats from current filtered trades
  const totalTrades = trades.length;
  const totalWins = trades.filter(t => t.result === 'WIN').length;
  const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
  const netProfitLoss = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;

  return (
    <>
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-6">
        <h2 className="text-lg font-semibold mb-4">🔍 Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result
            </label>
            <select 
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Results</option>
              <option value="WIN">Wins Only</option>
              <option value="LOSS">Losses Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <select 
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sessions</option>
              <option value="ASIA">🌏 Asia</option>
              <option value="EUROPE">🇪🇺 Europe</option>
              <option value="US">🇺🇸 US</option>
              <option value="OVERLAP">🔄 Overlap</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SOP
            </label>
            <select 
              value={sopFilter}
              onChange={(e) => setSopFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="true">Followed</option>
              <option value="false">Not Followed</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button size="sm" onClick={() => handleApplyFilters(1)} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Apply Filters'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearFilters} disabled={isLoading}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/L (USD)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <p className="text-lg font-semibold mb-2">No trades found</p>
                      <p className="text-sm mb-4">
                        {startDate || endDate || resultFilter || sessionFilter || sopFilter 
                          ? 'Try adjusting your filters or add a new trade'
                          : 'Start tracking your performance by adding your first trade'
                        }
                      </p>
                      <Link href="/trades/new">
                        <Button>➕ Add Trade</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {formatDateTime(trade.tradeTimestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getSessionBadge(trade.marketSession)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.result === 'WIN' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ WIN
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ LOSS
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.sopFollowed ? (
                        <span className="text-blue-600">✓ Yes</span>
                      ) : (
                        <span className="text-orange-600">✗ No</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      trade.profitLossUsd > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/trades/${trade.id}`}>
                          <Button size="sm" variant="outline">View</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {trades.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t bg-gray-50 gap-4">
            <Button 
              size="sm"
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || isLoading}
              variant="outline"
            >
              ← Previous
            </Button>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="text-sm text-gray-700">
                <span className="font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <span className="text-gray-500 ml-2">
                  ({totalCount} total trades)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-sm text-gray-600 whitespace-nowrap">
                  Show:
                </label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value, 10))}
                  disabled={isLoading}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              variant="outline"
            >
              Next →
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">Total Trades</p>
          <p className="text-2xl font-bold">{totalTrades}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-green-600">{winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">SOP Rate</p>
          <p className="text-2xl font-bold text-blue-600">{sopRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">Net P/L</p>
          <p className={`text-2xl font-bold ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfitLoss >= 0 ? '+' : ''}${netProfitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {trades.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✅ Showing {trades.length} Trades</h3>
          <p className="text-sm text-green-800">
            {startDate || endDate || resultFilter || sessionFilter || sopFilter 
              ? 'Filtered results based on your criteria'
              : 'Displaying all your trades'
            }
          </p>
        </div>
      )}
    </>
  );
}
