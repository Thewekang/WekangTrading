'use client';

/**
 * Trade List Client Component
 * Handles filtering, pagination, and display of trades
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExportModal } from '@/components/ExportModal';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string[]>([]);
  const [sopFilter, setSopFilter] = useState('');
  const [minProfitLoss, setMinProfitLoss] = useState('');
  const [maxProfitLoss, setMaxProfitLoss] = useState('');
  
  // Filter presets state
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTrades.length);
  const [pageSize, setPageSize] = useState(50);
  
  // Summary statistics (from ALL filtered trades, not just current page)
  const [summaryStats, setSummaryStats] = useState({
    totalTrades: initialTrades.length,
    totalWins: initialTrades.filter(t => t.result === 'WIN').length,
    totalLosses: initialTrades.filter(t => t.result === 'LOSS').length,
    totalSopFollowed: initialTrades.filter(t => t.sopFollowed).length,
    netProfitLoss: initialTrades.reduce((sum, t) => sum + t.profitLossUsd, 0),
    winRate: 0,
    sopRate: 0,
  });
  
  // Load filter presets from localStorage on mount
  useEffect(() => {
    const presets = localStorage.getItem('tradesFilterPresets');
    if (presets) {
      setSavedPresets(JSON.parse(presets));
    }
  }, []);
  
  // Load filters from URL parameters on mount
  useEffect(() => {
    const urlStartDate = searchParams.get('startDate');
    const urlEndDate = searchParams.get('endDate');
    const urlResult = searchParams.get('result');
    const urlSessions = searchParams.get('sessions');
    const urlSop = searchParams.get('sop');
    const urlMinPL = searchParams.get('minPL');
    const urlMaxPL = searchParams.get('maxPL');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlResult) setResultFilter(urlResult);
    if (urlSessions) setSessionFilter(urlSessions.split(','));
    if (urlSop) setSopFilter(urlSop);
    if (urlMinPL) setMinProfitLoss(urlMinPL);
    if (urlMaxPL) setMaxProfitLoss(urlMaxPL);
  }, [searchParams]);
  
  // Load pageSize from localStorage on mount
  useEffect(() => {
    const savedPageSize = localStorage.getItem('tradesPageSize');
    if (savedPageSize) {
      setPageSize(parseInt(savedPageSize, 10));
    }
  }, []);
  
  // Fetch initial pagination data on mount
  useEffect(() => {
    handleApplyFilters(1);
  }, [pageSize]); // Re-fetch when pageSize changes
  
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
    
    // Update URL parameters
    const urlParams = new URLSearchParams();
    if (startDate) urlParams.append('startDate', startDate);
    if (endDate) urlParams.append('endDate', endDate);
    if (resultFilter) urlParams.append('result', resultFilter);
    if (sessionFilter.length > 0) urlParams.append('sessions', sessionFilter.join(','));
    if (sopFilter) urlParams.append('sop', sopFilter);
    if (minProfitLoss) urlParams.append('minPL', minProfitLoss);
    if (maxProfitLoss) urlParams.append('maxPL', maxProfitLoss);
    
    router.push(`?${urlParams.toString()}`, { scroll: false });
    
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (resultFilter) params.append('result', resultFilter);
      if (sessionFilter.length > 0) params.append('marketSessions', sessionFilter.join(','));
      if (sopFilter) params.append('sopFollowed', sopFilter);
      if (minProfitLoss) params.append('minProfitLoss', minProfitLoss);
      if (maxProfitLoss) params.append('maxProfitLoss', maxProfitLoss);
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      const response = await fetch(`/api/trades/individual?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTrades(data.data.trades);
        setCurrentPage(data.data.pagination.page);
        setTotalPages(data.data.pagination.totalPages);
        setTotalCount(data.data.pagination.totalCount);
        
        // Update summary statistics from API
        if (data.data.summary) {
          setSummaryStats(data.data.summary);
        }
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
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
    setCurrentPage(1);
    
    // Clear URL parameters
    router.push(window.location.pathname, { scroll: false });
    
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
        
        // Update summary statistics from API
        if (data.data.summary) {
          setSummaryStats(data.data.summary);
        }
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Quick filter handlers
  const handleQuickFilterToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  const handleQuickFilterLast7Days = () => {
    const today = new Date();
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    setStartDate(last7Days.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  const handleQuickFilterLast30Days = () => {
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    setStartDate(last30Days.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  const handleQuickFilterWinsOnly = () => {
    setResultFilter('WIN');
    setStartDate('');
    setEndDate('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  const handleQuickFilterLossesOnly = () => {
    setResultFilter('LOSS');
    setStartDate('');
    setEndDate('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  const handleQuickFilterSOPFollowed = () => {
    setSopFilter('true');
    setStartDate('');
    setEndDate('');
    setResultFilter('');
    setSessionFilter([]);
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };
  
  // Save filter preset
  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    
    const preset = {
      name: presetName,
      filters: {
        startDate,
        endDate,
        resultFilter,
        sessionFilter,
        sopFilter,
        minProfitLoss,
        maxProfitLoss,
      },
    };
    
    const updatedPresets = [...savedPresets, preset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('tradesFilterPresets', JSON.stringify(updatedPresets));
    
    setPresetName('');
    setShowPresetInput(false);
  };
  
  // Load filter preset
  const handleLoadPreset = (preset: any) => {
    setStartDate(preset.filters.startDate);
    setEndDate(preset.filters.endDate);
    setResultFilter(preset.filters.resultFilter);
    setSessionFilter(preset.filters.sessionFilter);
    setSopFilter(preset.filters.sopFilter);
    setMinProfitLoss(preset.filters.minProfitLoss);
    setMaxProfitLoss(preset.filters.maxProfitLoss);
  };
  
  // Delete filter preset
  const handleDeletePreset = (presetIndex: number) => {
    const updatedPresets = savedPresets.filter((_, index) => index !== presetIndex);
    setSavedPresets(updatedPresets);
    localStorage.setItem('tradesFilterPresets', JSON.stringify(updatedPresets));
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
    // Re-fetch with new page size - will automatically trigger due to useEffect
  };

  return (
    <>
      {/* Quick Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-4 border mb-4">
        <h3 className="text-sm font-semibold mb-3">⚡ Quick Filters</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleQuickFilterToday}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📅 Today
          </Button>
          <Button
            onClick={handleQuickFilterLast7Days}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📆 Last 7 Days
          </Button>
          <Button
            onClick={handleQuickFilterLast30Days}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📊 Last 30 Days
          </Button>
          <Button
            onClick={handleQuickFilterWinsOnly}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            ✅ Wins Only
          </Button>
          <Button
            onClick={handleQuickFilterLossesOnly}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            ❌ Losses Only
          </Button>
          <Button
            onClick={handleQuickFilterSOPFollowed}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📋 SOP Followed
          </Button>
        </div>
      </div>

      {/* Filter Presets Section */}
      <div className="bg-white rounded-lg shadow-md p-4 border mb-4">
        <h3 className="text-sm font-semibold mb-3">💾 Filter Presets</h3>
        
        {/* Load Presets */}
        {savedPresets.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-600 mb-2">Load a preset:</p>
            <div className="flex flex-wrap gap-2">
              {savedPresets.map((preset, index) => (
                <div key={index} className="flex items-center gap-1">
                  <Button
                    onClick={() => handleLoadPreset(preset)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                  <button
                    onClick={() => handleDeletePreset(index)}
                    className="text-red-500 hover:text-red-700 text-xs"
                    title="Delete preset"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Save Preset */}
        <div>
          {!showPresetInput ? (
            <Button
              onClick={() => setShowPresetInput(true)}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              ➕ Save Current Filters as Preset
            </Button>
          ) : (
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <Button
                onClick={handleSavePreset}
                size="sm"
                className="text-xs"
              >
                Save
              </Button>
              <Button
                onClick={() => {
                  setShowPresetInput(false);
                  setPresetName('');
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

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
            <div className="space-y-2">
              {['ASIA', 'EUROPE', 'US', 'OVERLAP'].map((session) => (
                <label key={session} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sessionFilter.includes(session)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSessionFilter([...sessionFilter, session]);
                      } else {
                        setSessionFilter(sessionFilter.filter(s => s !== session));
                      }
                    }}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {session === 'ASIA' && '🌏 Asia'}
                    {session === 'EUROPE' && '🇪🇺 Europe'}
                    {session === 'US' && '🇺🇸 US'}
                    {session === 'OVERLAP' && '🔄 Overlap'}
                  </span>
                </label>
              ))}
            </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min P/L ($)
            </label>
            <input
              type="number"
              value={minProfitLoss}
              onChange={(e) => setMinProfitLoss(e.target.value)}
              placeholder="e.g., -100"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max P/L ($)
            </label>
            <input
              type="number"
              value={maxProfitLoss}
              onChange={(e) => setMaxProfitLoss(e.target.value)}
              placeholder="e.g., 100"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button size="sm" onClick={() => handleApplyFilters(1)} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Apply Filters'}
          </Button>
          <Button size="sm" variant="outline" onClick={handleClearFilters} disabled={isLoading}>
            Clear Filters
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setShowExportModal(true)}
            className="ml-auto"
          >
            📥 Export Data
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
          <p className="text-2xl font-bold">{summaryStats.totalTrades}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">Win Rate</p>
          <p className="text-2xl font-bold text-green-600">{summaryStats.winRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">SOP Rate</p>
          <p className="text-2xl font-bold text-blue-600">{summaryStats.sopRate.toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border text-center">
          <p className="text-sm text-gray-600 mb-1">Net P/L</p>
          <p className={`text-2xl font-bold ${summaryStats.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summaryStats.netProfitLoss >= 0 ? '+' : ''}${summaryStats.netProfitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {trades.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✅ Showing {trades.length} Trades</h3>
          <p className="text-sm text-green-800">
            {startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss
              ? 'Filtered results based on your criteria'
              : 'Displaying all your trades'
            }
          </p>
          {/* Active Filters */}
          {(startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {startDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  From: {new Date(startDate).toLocaleDateString()}
                </span>
              )}
              {endDate && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  To: {new Date(endDate).toLocaleDateString()}
                </span>
              )}
              {resultFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Result: {resultFilter}
                </span>
              )}
              {sessionFilter.length > 0 && sessionFilter.map(session => (
                <span key={session} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Session: {session}
                </span>
              ))}
              {sopFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  SOP: {sopFilter === 'true' ? 'Followed' : 'Not Followed'}
                </span>
              )}
              {minProfitLoss && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Min P/L: ${minProfitLoss}
                </span>
              )}
              {maxProfitLoss && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Max P/L: ${maxProfitLoss}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        currentFilters={{
          startDate,
          endDate,
          result: resultFilter,
          marketSession: sessionFilter.join(','),
          sopFollowed: sopFilter,
          minProfitLoss,
          maxProfitLoss,
        }}
      />
    </>
  );
}
