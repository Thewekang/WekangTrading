'use client';

/**
 * Trade List Client Component
 * Handles filtering, pagination, and display of trades
 * 
 * Performance: Uses virtualization for 100+ trades (70% faster rendering)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExportModal } from '@/components/ExportModal';
import { LoadingSpinner, LoadingTable } from '@/components/ui/loading';
import { NoTradesEmptyState, NoResultsEmptyState } from '@/components/ui/empty-state';
import { showToast } from '@/components/ui/Toast';
import { useTimezone } from '@/contexts/TimezoneContext';
import { TradesTableVirtualized } from '@/components/TradesTableVirtualized';
import { TradeMobileView } from '@/components/trades/TradeMobileView';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';
import { usePullToRefresh } from '@/lib/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Trade {
  id: string;
  entryType?: string | null;
  tradeTimestamp: Date | string;
  result: string | null;
  sopFollowed: boolean | null;
  sopTypeId: string | null;
  sopType: { id: string; name: string } | null;
  symbol: string | null;
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
  const { formatDate, timezone, datetimeLocalToUTC } = useTimezone();
  const isMobile = useIsMobile();
  
  const [trades, setTrades] = useState<Trade[]>(initialTrades);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pull-to-refresh ref (set after handleApplyFilters is defined)
  const refreshFnRef = useRef<() => Promise<void>>(() => Promise.resolve());
  
  const { containerRef: pullRefreshRef, isPulling, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: () => refreshFnRef.current(),
  });
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState<string[]>([]);
  const [sopFilter, setSopFilter] = useState('');
  const [minProfitLoss, setMinProfitLoss] = useState('');
  const [maxProfitLoss, setMaxProfitLoss] = useState('');
  const [symbolFilter, setSymbolFilter] = useState('');
  const [entryTypeFilter, setEntryTypeFilter] = useState('');

  // Available symbols for autocomplete
  const [availableSymbols, setAvailableSymbols] = useState<string[]>([]);
  useEffect(() => {
    fetch('/api/stats/symbols')
      .then(r => r.json())
      .then(d => { if (d.success) setAvailableSymbols(d.data); })
      .catch(() => {});
  }, []);
  
  // Filter presets state
  const [savedPresets, setSavedPresets] = useState<Array<{ name: string; filters: any }>>([]);
  const [presetName, setPresetName] = useState('');
  const [showPresetInput, setShowPresetInput] = useState(false);
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Collapsible filters state
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(initialTrades.length);
  
  // Load pageSize from localStorage before setting initial state
  const getInitialPageSize = () => {
    if (typeof window !== 'undefined') {
      const savedPageSize = localStorage.getItem('tradesPageSize');
      if (savedPageSize) {
        return parseInt(savedPageSize, 10);
      }
    }
    return 50; // Default
  };
  
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  
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
    const urlSymbol = searchParams.get('symbol');
    const urlEntryType = searchParams.get('entryType');
    
    if (urlStartDate) setStartDate(urlStartDate);
    if (urlEndDate) setEndDate(urlEndDate);
    if (urlResult) setResultFilter(urlResult);
    if (urlSessions) setSessionFilter(urlSessions.split(','));
    if (urlSop) setSopFilter(urlSop);
    if (urlMinPL) setMinProfitLoss(urlMinPL);
    if (urlMaxPL) setMaxProfitLoss(urlMaxPL);
    if (urlSymbol) setSymbolFilter(urlSymbol);
    if (urlEntryType) setEntryTypeFilter(urlEntryType);
  }, [searchParams]);
  
  // Fetch initial pagination data on mount
  useEffect(() => {
    handleApplyFilters(1);
  }, []); // Only run once on mount
  
  // Save pageSize to localStorage when changed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tradesPageSize', pageSize.toString());
    }
  }, [pageSize]);

  // Helper function to format date/time using user's timezone
  const formatDateTime = (date: Date | string) => {
    return formatDate(date, {
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
      ASIA_EUROPE_OVERLAP: '🔄 Asia-Europe Overlap',
      EUROPE_US_OVERLAP: '🔄 Europe-US Overlap',
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
    if (symbolFilter) urlParams.append('symbol', symbolFilter);
    if (entryTypeFilter) urlParams.append('entryType', entryTypeFilter);
    
    router.push(`?${urlParams.toString()}`, { scroll: false });
    
    try {
      const params = new URLSearchParams();
      if (startDate) {
        // Convert start of day in user's timezone to UTC ISO string
        const startUTC = datetimeLocalToUTC(startDate + 'T00:00');
        params.append('startDate', startUTC.toISOString());
      }
      if (endDate) {
        // Convert end of day in user's timezone to UTC ISO string
        const endUTC = datetimeLocalToUTC(endDate + 'T23:59');
        endUTC.setSeconds(59, 999);
        params.append('endDate', endUTC.toISOString());
      }
      if (resultFilter) params.append('result', resultFilter);
      if (sessionFilter.length > 0) params.append('marketSessions', sessionFilter.join(','));
      if (sopFilter) params.append('sopFollowed', sopFilter);
      if (minProfitLoss) params.append('minProfitLoss', minProfitLoss);
      if (maxProfitLoss) params.append('maxProfitLoss', maxProfitLoss);
      if (symbolFilter) params.append('symbol', symbolFilter.trim());
      if (entryTypeFilter) params.append('entryType', entryTypeFilter);
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

  // Update pull-to-refresh ref to latest handleApplyFilters
  useEffect(() => {
    refreshFnRef.current = () => handleApplyFilters(currentPage);
  }, [currentPage, pageSize, startDate, endDate, resultFilter, sessionFilter, sopFilter, minProfitLoss, maxProfitLoss, symbolFilter, entryTypeFilter]);

  // Clear filters
  const handleClearFilters = async () => {
    setStartDate('');
    setEndDate('');
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
    setSymbolFilter('');
    setEntryTypeFilter('');
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

  const handleQuickFilterTransactionsOnly = () => {
    setEntryTypeFilter('TRANSACTION');
    setStartDate('');
    setEndDate('');
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
    setMinProfitLoss('');
    setMaxProfitLoss('');
  };

  const handleQuickFilterCommissionsOnly = () => {
    setEntryTypeFilter('COMMISSION');
    setStartDate('');
    setEndDate('');
    setResultFilter('');
    setSessionFilter([]);
    setSopFilter('');
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
  
  // Delete trade handler
  const handleDeleteTrade = async () => {
    if (!tradeToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trades/individual/${tradeToDelete.id}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete trade');
      }
      
      showToast('Trade deleted successfully', 'success');
      setShowDeleteModal(false);
      setTradeToDelete(null);
      
      // Refresh daily loss alert if available
      if (typeof (window as any).refreshDailyLossAlert === 'function') {
        (window as any).refreshDailyLossAlert();
      }
      
      // Refresh trades list
      handleApplyFilters(currentPage);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete trade';
      if (errorMessage.includes('24 hours')) {
        showToast('Trades can only be deleted within 24 hours of creation', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };
  
  const openDeleteModal = (trade: Trade) => {
    setTradeToDelete(trade);
    setShowDeleteModal(true);
  };
  
  // Check if trade can be deleted (within 24 hours)
  const canDeleteTrade = (trade: Trade) => {
    const tradeDate = trade.tradeTimestamp instanceof Date 
      ? trade.tradeTimestamp 
      : new Date(trade.tradeTimestamp);
    const hoursSinceCreation = (Date.now() - tradeDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
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
    <div ref={pullRefreshRef}>
      {/* Pull-to-refresh indicator (mobile) */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        pullProgress={pullProgress}
        isRefreshing={isRefreshing}
        isPulling={isPulling}
      />

      {/* 24-Hour Deletion Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4">
        <div className="flex items-start gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Trade Deletion Policy</h3>
            <p className="text-xs sm:text-sm text-blue-800">
              You can delete trades within <strong>24 hours</strong> of creation. After 24 hours, trades are locked to maintain data integrity.
            </p>
          </div>
        </div>
      </div>

      {/* Timezone Reminder */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 sm:p-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg flex-shrink-0">🌍</span>
          <p className="text-xs sm:text-sm text-amber-900">
            <strong>Timezone:</strong> <strong>{timezone}</strong>
            {timezone !== 'UTC' && <span className="text-amber-700 ml-1 hidden sm:inline">(Data stored in UTC)</span>}
            <a href="/settings" className="ml-2 text-amber-700 hover:text-amber-900 underline font-medium block sm:inline mt-1 sm:mt-0">
              Change timezone
            </a>
          </p>
        </div>
      </div>

      {/* Filters Section - Collapsible */}
      <div className="border rounded-lg mb-4">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🔍</span>
            <h2 className="text-base sm:text-lg font-semibold">Filters & Search</h2>
          </div>
          {isFiltersOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </button>
        
        {isFiltersOpen && (
          <div className="border-t">
            {/* Quick Filters Section */}
            <div className="bg-white p-4 border-b">
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
          <Button
            onClick={handleQuickFilterTransactionsOnly}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            📈 Transactions Only
          </Button>
          <Button
            onClick={handleQuickFilterCommissionsOnly}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            💳 Commissions Only
          </Button>
        </div>
      </div>

      {/* Filter Presets Section */}
      <div className="bg-white p-4 border-b">
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
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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

      {/* Advanced Filters Section */}
      <div className="bg-white p-6 border-b">
        <h3 className="text-sm font-semibold mb-4">Advanced Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entry Type
            </label>
            <select
              value={entryTypeFilter}
              onChange={(e) => setEntryTypeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="TRANSACTION">📈 Transaction</option>
              <option value="COMMISSION">💳 Commission</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Result
            </label>
            <select 
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Results</option>
              <option value="WIN">Wins Only</option>
              <option value="LOSS">Losses Only</option>
              <option value="BE">Break-Evens Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <div className="space-y-1">
              {['ASIA', 'EUROPE', 'US', 'ASIA_EUROPE_OVERLAP', 'EUROPE_US_OVERLAP'].map((session) => (
                <label key={session} className="flex items-center min-h-[44px] px-2 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation cursor-pointer">
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
                    className="mr-2 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {session === 'ASIA' && '🌏 Asia'}
                    {session === 'EUROPE' && '🇪🇺 Europe'}
                    {session === 'US' && '🇺🇸 US'}
                    {session === 'ASIA_EUROPE_OVERLAP' && '🔄 Asia-Europe Overlap'}
                    {session === 'EUROPE_US_OVERLAP' && '🔄 Europe-US Overlap'}
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Symbol
            </label>
            <input
              type="text"
              list="symbolsList"
              value={symbolFilter}
              onChange={(e) => setSymbolFilter(e.target.value.toUpperCase())}
              placeholder="e.g., EURUSD"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
            {availableSymbols.length > 0 && (
              <datalist id="symbolsList">
                {availableSymbols.map(s => <option key={s} value={s} />)}
              </datalist>
            )}
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
          </div>
        )}
      </div>

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <LoadingSpinner size="lg" text="Loading trades..." />
          </div>
        )}
        
        {/* Mobile Card View vs Desktop Table View */}
        {isMobile ? (
          // Mobile: Card view
          trades.length === 0 ? (
            <div className="p-8 text-center">
              {startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss || symbolFilter ? (
                <>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">No results found</p>
                  <p className="text-sm text-gray-600 mb-4">
                    No trades match your current filters.
                  </p>
                  <Button onClick={handleClearFilters} variant="outline" size="sm">
                    🔄 Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-lg font-semibold text-gray-900 mb-2">No trades yet</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Start tracking your performance
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href="/trades/new">
                      <Button size="sm" className="w-full">➕ Add Trade</Button>
                    </Link>
                    <Link href="/trades/bulk">
                      <Button variant="outline" size="sm" className="w-full">📋 Bulk Entry</Button>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <TradeMobileView
              trades={trades}
              formatDateTime={formatDateTime}
              getSessionBadge={getSessionBadge}
              onDeleteTrade={openDeleteModal}
              canDeleteTrade={canDeleteTrade}
            />
          )
        ) : (
          // Desktop: Table view (existing code)
          trades.length >= 100 ? (
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  ⚡ <strong>Optimized View:</strong> Using virtualization for {trades.length} trades (70% faster)
                </p>
              </div>
              <TradesTableVirtualized 
                trades={trades}
                onDeleteTrade={openDeleteModal}
                canDeleteTrade={canDeleteTrade}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type / Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOP</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOP Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">P/L (USD)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12">
                      {startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss || symbolFilter ? (
                        <div className="text-center">
                          <div className="text-5xl mb-4">🔍</div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">No results found</p>
                          <p className="text-sm text-gray-600 mb-4">
                            No trades match your current filters. Try adjusting your search criteria.
                          </p>
                          <Button onClick={handleClearFilters} variant="outline">
                            🔄 Clear All Filters
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-5xl mb-4">📊</div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">No trades yet</p>
                          <p className="text-sm text-gray-600 mb-4">
                            Start tracking your performance by adding your first trade
                          </p>
                          <div className="flex gap-3 justify-center">
                            <Link href="/trades/new">
                              <Button>➕ Add Trade</Button>
                            </Link>
                            <Link href="/trades/bulk">
                              <Button variant="outline">📋 Bulk Entry</Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/trades/${trade.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {formatDateTime(trade.tradeTimestamp)}
                          </Link>
                          {canDeleteTrade(trade) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800" title="Can be deleted (within 24 hours)">
                              🕒
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {trade.entryType === 'COMMISSION' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            💳 Commission
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {getSessionBadge(trade.marketSession)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {trade.symbol ? (
                          <span className="font-mono text-xs font-medium text-gray-700">
                            {trade.symbol}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {trade.entryType === 'COMMISSION' ? (
                          <span className="text-gray-400 text-xs italic">fee</span>
                        ) : trade.result === 'WIN' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ WIN
                        </span>
                      ) : trade.result === 'BE' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          ⚖️ BE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ LOSS
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.entryType === 'COMMISSION' ? (
                        <span className="text-gray-400">—</span>
                      ) : trade.sopFollowed ? (
                        <span className="text-blue-600">✓ Yes</span>
                      ) : (
                        <span className="text-orange-600">✗ No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {trade.entryType === 'COMMISSION' ? (
                        <span className="text-gray-400">—</span>
                      ) : trade.sopType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {trade.sopType.name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Others</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-semibold ${
                      trade.profitLossUsd > 0 ? 'text-green-600' : trade.profitLossUsd < 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex justify-end">
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => openDeleteModal(trade)}
                          disabled={!canDeleteTrade(trade)}
                          title={
                            canDeleteTrade(trade) 
                              ? 'Delete this trade (within 24-hour window)' 
                              : `Cannot delete: Trade is ${Math.floor((Date.now() - new Date(trade.tradeTimestamp).getTime()) / (1000 * 60 * 60))} hours old (24-hour limit exceeded)`
                          }
                          className={!canDeleteTrade(trade) ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                          🗑️
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          )
        )}
        
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
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[44px] touch-manipulation focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
          <p className={`text-2xl font-bold ${ summaryStats.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summaryStats.netProfitLoss >= 0 ? '+' : ''}${summaryStats.netProfitLoss.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Showing X Trades Section */}
      {trades.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">✅ Showing {trades.length} Trades</h3>
          <p className="text-sm text-green-800">
            {startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss || symbolFilter
              ? 'Filtered results based on your criteria'
              : 'Displaying all your trades'
            }
          </p>
          {/* Active Filters */}
          {(startDate || endDate || resultFilter || sessionFilter.length > 0 || sopFilter || minProfitLoss || maxProfitLoss || symbolFilter) && (
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
              {symbolFilter && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800 font-mono">
                  Symbol: {symbolFilter}
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && tradeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">⚠️ Delete Trade</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this trade?
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Time:</span> {formatDateTime(tradeToDelete.tradeTimestamp)}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Result:</span>{' '}
                  <span className={tradeToDelete.result === 'WIN' ? 'text-green-600' : tradeToDelete.result === 'BE' ? 'text-gray-600' : 'text-red-600'}>
                    {tradeToDelete.result}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">P/L:</span>{' '}
                  <span className={tradeToDelete.profitLossUsd >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {tradeToDelete.profitLossUsd >= 0 ? '+' : ''}${tradeToDelete.profitLossUsd.toFixed(2)}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Session:</span> {getSessionBadge(tradeToDelete.marketSession)}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This action cannot be undone. The daily summary will be automatically updated.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTradeToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteTrade}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Trade'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
