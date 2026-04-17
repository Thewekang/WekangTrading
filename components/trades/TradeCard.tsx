"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink } from 'lucide-react';

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

interface TradeCardProps {
  trade: Trade;
  formatDateTime: (date: Date | string) => string;
  getSessionBadge: (session: string) => string;
  onDelete: (trade: Trade) => void;
  canDelete: boolean;
}

export function TradeCard({ 
  trade, 
  formatDateTime, 
  getSessionBadge, 
  onDelete, 
  canDelete 
}: TradeCardProps) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${trade.entryType === 'COMMISSION' ? 'border-amber-200' : ''}`}>
      {/* Header: Time & Session */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link 
            href={`/trades/${trade.id}`}
            className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            {formatDateTime(trade.tradeTimestamp)}
            <ExternalLink className="h-3 w-3" />
          </Link>
          <div className="mt-1 flex items-center gap-1 flex-wrap">
            {trade.entryType === 'COMMISSION' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                💳 Commission
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {getSessionBadge(trade.marketSession)}
              </span>
            )}
            {canDelete && (
              <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800" title="Can be deleted">
                🕒 24h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Result */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Result</div>
          {trade.entryType === 'COMMISSION' ? (
            <span className="text-gray-400 text-xs italic">Commission fee</span>
          ) : trade.result === 'WIN' ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-green-100 text-green-800">
              ✅ WIN
            </span>
          ) : trade.result === 'BE' ? (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700">
              ⚖️ BE
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800">
              ❌ LOSS
            </span>
          )}
        </div>

        {/* P/L */}
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">Profit/Loss</div>
          <div className={`text-base font-bold ${
            trade.profitLossUsd > 0 ? 'text-green-600' : trade.profitLossUsd < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
          </div>
        </div>

        {/* Symbol */}
        <div>
          <div className="text-xs text-gray-500 mb-1">Symbol</div>
          {trade.symbol ? (
            <span className="font-mono text-sm font-medium text-gray-700">
              {trade.symbol}
            </span>
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>

        {/* SOP */}
        <div className="text-right">
          <div className="text-xs text-gray-500 mb-1">SOP</div>
          {trade.entryType === 'COMMISSION' ? (
            <span className="text-gray-400 text-xs">—</span>
          ) : trade.sopFollowed ? (
            <span className="text-blue-600 font-medium text-sm">✓ Yes</span>
          ) : (
            <span className="text-orange-600 font-medium text-sm">✗ No</span>
          )}
        </div>
      </div>

      {/* SOP Type */}
      {trade.entryType !== 'COMMISSION' && trade.sopType && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 mb-1">SOP Type</div>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
            {trade.sopType.name}
          </span>
        </div>
      )}

      {/* Notes Section */}
      {trade.notes && (
        <div className="mb-3">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-xs text-gray-600 hover:text-gray-900 active:text-gray-900 font-medium min-h-[44px] px-2 -ml-2 rounded-md hover:bg-gray-50 active:bg-gray-100 touch-manipulation"
          >
            {showNotes ? '▼' : '▶'} Notes
          </button>
          {showNotes && (
            <p className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded border">
              {trade.notes}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t">
        <Link href={`/trades/${trade.id}`} className="flex-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full text-xs h-9"
          >
            View Details
          </Button>
        </Link>
        <Button 
          size="sm" 
          variant="destructive"
          onClick={() => onDelete(trade)}
          disabled={!canDelete}
          title={
            canDelete 
              ? 'Delete this trade' 
              : 'Cannot delete: 24-hour limit exceeded'
          }
          className="h-9 px-3"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
