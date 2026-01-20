/**
 * TradesTableVirtualized - Virtualized table for rendering large trade lists
 * Uses react-window for efficient rendering of 100+ rows
 */

'use client';

import { FixedSizeList } from 'react-window';
import { Button } from '@/components/ui/button';
import { useTimezone } from '@/contexts/TimezoneContext';

interface Trade {
  id: string;
  tradeTimestamp: Date | string;
  result: string;
  sopFollowed: boolean;
  sopTypeId: string | null;
  sopType: { id: string; name: string } | null;
  symbol: string | null;
  profitLossUsd: number;
  marketSession: string;
  notes: string | null;
}

interface TradesTableVirtualizedProps {
  trades: Trade[];
  onDeleteTrade: (trade: Trade) => void;
  canDeleteTrade: (trade: Trade) => boolean;
}

// Single row component (memoized for performance)
const TradeRow = ({ 
  index, 
  style, 
  data 
}: { 
  index: number; 
  style: React.CSSProperties; 
  data: { 
    trades: Trade[]; 
    onDeleteTrade: (trade: Trade) => void;
    canDeleteTrade: (trade: Trade) => boolean;
    formatDateTime: (date: Date | string) => string;
    getSessionBadge: (session: string) => string;
  } 
}) => {
  const { trades, onDeleteTrade, canDeleteTrade, formatDateTime, getSessionBadge } = data;
  const trade = trades[index];
  
  if (!trade) return null;

  return (
    <div 
      style={style} 
      className={`flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors px-4 ${
        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
      }`}
    >
      {/* Time */}
      <div className="flex-[2] py-3 text-sm text-gray-900 pr-4">
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap">{formatDateTime(trade.tradeTimestamp)}</span>
          {canDeleteTrade(trade) && (
            <span 
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800" 
              title="Can be deleted (within 24 hours)"
            >
              🕒
            </span>
          )}
        </div>
      </div>

      {/* Session */}
      <div className="flex-[2] py-3 text-sm pr-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {getSessionBadge(trade.marketSession)}
        </span>
      </div>

      {/* Symbol */}
      <div className="flex-[1] py-3 text-sm pr-4">
        {trade.symbol ? (
          <span className="font-mono text-xs font-medium text-gray-700">
            {trade.symbol}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>

      {/* Result */}
      <div className="flex-[1.5] py-3 text-sm pr-4">
        {trade.result === 'WIN' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ✅ WIN
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            ❌ LOSS
          </span>
        )}
      </div>

      {/* SOP */}
      <div className="flex-[1] py-3 text-sm pr-4">
        {trade.sopFollowed ? (
          <span className="text-blue-600">✓ Yes</span>
        ) : (
          <span className="text-orange-600">✗ No</span>
        )}
      </div>

      {/* SOP Type */}
      <div className="flex-[1.5] py-3 text-sm pr-4">
        {trade.sopType ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {trade.sopType.name}
          </span>
        ) : (
          <span className="text-gray-400 text-xs italic">Others</span>
        )}
      </div>

      {/* P/L */}
      <div className={`flex-[1.5] py-3 text-sm text-right font-semibold pr-4 ${
        trade.profitLossUsd > 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
      </div>

      {/* Actions */}
      <div className="flex-[1] py-3 text-sm text-right">
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onDeleteTrade(trade)}
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
    </div>
  );
};

export function TradesTableVirtualized({ 
  trades, 
  onDeleteTrade, 
  canDeleteTrade 
}: TradesTableVirtualizedProps) {
  const { formatDate } = useTimezone();

  const formatDateTime = (date: Date | string) => {
    return formatDate(date, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  // Calculate height: 60px per row, max 600px (10 rows), min 300px (5 rows)
  const listHeight = Math.min(Math.max(trades.length * 60, 300), 600);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="flex items-center bg-gray-50 border-b px-4 py-3">
        <div className="flex-[2] text-left text-xs font-medium text-gray-500 uppercase pr-4">Time</div>
        <div className="flex-[2] text-left text-xs font-medium text-gray-500 uppercase pr-4">Session</div>
        <div className="flex-[1] text-left text-xs font-medium text-gray-500 uppercase pr-4">Symbol</div>
        <div className="flex-[1.5] text-left text-xs font-medium text-gray-500 uppercase pr-4">Result</div>
        <div className="flex-[1] text-left text-xs font-medium text-gray-500 uppercase pr-4">SOP</div>
        <div className="flex-[1.5] text-left text-xs font-medium text-gray-500 uppercase pr-4">SOP Type</div>
        <div className="flex-[1.5] text-right text-xs font-medium text-gray-500 uppercase pr-4">P/L (USD)</div>
        <div className="flex-[1] text-right text-xs font-medium text-gray-500 uppercase">Actions</div>
      </div>

      {/* Virtualized List */}
      <FixedSizeList
        height={listHeight}
        itemCount={trades.length}
        itemSize={60}
        width="100%"
        itemData={{
          trades,
          onDeleteTrade,
          canDeleteTrade,
          formatDateTime,
          getSessionBadge,
        }}
      >
        {TradeRow}
      </FixedSizeList>
    </div>
  );
}
