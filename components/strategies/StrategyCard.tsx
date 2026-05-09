'use client';

import { useState } from 'react';
import { MoreVertical, Calculator, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PositionCalculator } from './PositionCalculator';
import type { AccountStrategy } from '@/lib/db/schema/strategies';

// ── Market session labels ──────────────────────────────────────────────────
const SESSION_LABELS: Record<string, string> = {
  ASIA: 'Asia',
  ASIA_EUROPE_OVERLAP: 'Asia/EU',
  EUROPE: 'Europe',
  EUROPE_US_OVERLAP: 'EU/US',
  US: 'US',
};

const SESSION_COLORS: Record<string, string> = {
  ASIA: 'bg-yellow-100 text-yellow-700',
  ASIA_EUROPE_OVERLAP: 'bg-orange-100 text-orange-700',
  EUROPE: 'bg-blue-100 text-blue-700',
  EUROPE_US_OVERLAP: 'bg-indigo-100 text-indigo-700',
  US: 'bg-green-100 text-green-700',
};

const INSTRUMENT_COLORS: Record<string, string> = {
  FUTURES: 'bg-purple-100 text-purple-700 border-purple-200',
  FOREX: 'bg-blue-100 text-blue-700 border-blue-200',
  COMMODITY: 'bg-amber-100 text-amber-700 border-amber-200',
  INDEX: 'bg-teal-100 text-teal-700 border-teal-200',
  CRYPTO: 'bg-orange-100 text-orange-700 border-orange-200',
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface StrategyCardData extends Omit<AccountStrategy, 'bestSessions'> {
  bestSessions: string[]; // Already parsed from JSON
}

interface Props {
  strategy: StrategyCardData;
  accountBalance?: number | null;
  calculatorLeverage?: number | null;
  onEdit: (strategy: StrategyCardData) => void;
  onDelete: (strategyId: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRR(slPoints: number | null, tpPoints: number | null): string {
  if (!slPoints || !tpPoints || slPoints === 0) return '—';
  const rr = tpPoints / slPoints;
  return `1:${rr % 1 === 0 ? rr.toFixed(0) : rr.toFixed(1)}`;
}

function formatPoints(points: number | null | undefined, isFutures: boolean): string {
  if (points == null) return '—';
  return `${points}${isFutures ? ' tks' : ' pips'}`;
}

// ── Component ──────────────────────────────────────────────────────────────

export function StrategyCard({ strategy, accountBalance, calculatorLeverage, onEdit, onDelete }: Props) {
  const [showCalculator, setShowCalculator] = useState(false);
  const isFutures = strategy.instrumentType === 'FUTURES';
  const unitLabel = isFutures ? 'contracts' : 'lots';

  return (
    <>
      <Card className="p-4 flex flex-col gap-3 border border-gray-200 hover:border-gray-300 transition-colors bg-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900 tracking-wide">{strategy.symbol}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${INSTRUMENT_COLORS[strategy.instrumentType] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}
            >
              {strategy.instrumentType}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(strategy)}>
                <Edit className="h-4 w-4 mr-2" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(strategy.id)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Position defaults grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Default size</span>
            <span className="font-medium text-gray-900">
              {strategy.defaultLotSize ?? '—'} {unitLabel}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Risk %</span>
            <span className="font-medium text-gray-900">
              {strategy.riskPercentPerTrade ?? '—'}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Stop Loss</span>
            <span className="font-semibold text-red-600">
              {formatPoints(strategy.stopLossPoints, isFutures)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Max/day</span>
            <span className="font-medium text-gray-900">
              {strategy.maxTradesPerDay ?? '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">TP1</span>
            <span className="font-semibold text-green-600">
              {formatPoints(strategy.tp1Points, isFutures)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">R:R (TP1)</span>
            <span className="font-medium text-gray-900">
              {formatRR(strategy.stopLossPoints, strategy.tp1Points)}
            </span>
          </div>
          {strategy.tp2Points != null && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">TP2</span>
                <span className="font-semibold text-emerald-600">
                  {formatPoints(strategy.tp2Points, isFutures)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">R:R (TP2)</span>
                <span className="font-medium text-gray-900">
                  {formatRR(strategy.stopLossPoints, strategy.tp2Points)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Tick/pip info */}
        {isFutures && strategy.tickSize != null && strategy.tickValue != null && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            Tick: {strategy.tickSize} pts = ${strategy.tickValue}/contract
          </div>
        )}
        {!isFutures && strategy.pipValue != null && (
          <div className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
            Pip value: ${strategy.pipValue}/lot
          </div>
        )}

        {/* Best sessions */}
        {strategy.bestSessions.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <TrendingUp className="h-3 w-3 text-gray-400 shrink-0" />
            {strategy.bestSessions.map((s) => (
              <span
                key={s}
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${SESSION_COLORS[s] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {SESSION_LABELS[s] ?? s}
              </span>
            ))}
          </div>
        )}

        {/* Entry notes */}
        {strategy.entryNotes && (
          <p className="text-xs text-gray-500 line-clamp-2 italic">{strategy.entryNotes}</p>
        )}

        {/* Calculate button */}
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-1 gap-2"
          onClick={() => setShowCalculator(true)}
        >
          <Calculator className="h-4 w-4" />
          Calculate Position
        </Button>
      </Card>

      {/* Position Calculator modal */}
      {showCalculator && (
        <PositionCalculator
          strategy={strategy}
          defaultBalance={accountBalance}
          defaultLeverage={calculatorLeverage}
          onClose={() => setShowCalculator(false)}
        />
      )}
    </>
  );
}
