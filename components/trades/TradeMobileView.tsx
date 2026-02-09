"use client";

import { TradeCard } from './TradeCard';

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

interface TradeMobileViewProps {
  trades: Trade[];
  formatDateTime: (date: Date | string) => string;
  getSessionBadge: (session: string) => string;
  onDeleteTrade: (trade: Trade) => void;
  canDeleteTrade: (trade: Trade) => boolean;
}

export function TradeMobileView({
  trades,
  formatDateTime,
  getSessionBadge,
  onDeleteTrade,
  canDeleteTrade,
}: TradeMobileViewProps) {
  return (
    <div className="space-y-3 p-4">
      {trades.map((trade) => (
        <TradeCard
          key={trade.id}
          trade={trade}
          formatDateTime={formatDateTime}
          getSessionBadge={getSessionBadge}
          onDelete={onDeleteTrade}
          canDelete={canDeleteTrade(trade)}
        />
      ))}
    </div>
  );
}
