'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { StrategyCardData } from './StrategyCard';

interface Props {
  strategy: StrategyCardData;
  defaultBalance?: number | null;
  defaultLeverage?: number | null;
  onClose: () => void;
}

interface CalcResult {
  riskUsd: number;
  riskPerContract: number;
  maxSize: number;
  tp1Pnl: number | null;
  tp2Pnl: number | null;
  rrTp1: string;
  rrTp2: string;
}

function formatUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
}

function calcResult(
  isFutures: boolean,
  balance: number,
  riskPct: number,
  slPoints: number,
  tp1Points: number | null,
  tp2Points: number | null,
  tickSize: number | null,
  tickValue: number | null,
  pipValue: number | null,
): CalcResult | null {
  if (!balance || !riskPct || !slPoints) return null;

  const riskUsd = (balance * riskPct) / 100;

  let riskPerUnit: number;
  if (isFutures) {
    if (!tickSize || !tickValue) return null;
    const slTicks = slPoints / tickSize;
    riskPerUnit = slTicks * tickValue; // USD risk per contract
  } else {
    if (!pipValue) return null;
    riskPerUnit = slPoints * pipValue; // USD risk per standard lot
  }

  if (riskPerUnit === 0) return null;

  const maxSize = riskUsd / riskPerUnit;

  let tp1Pnl: number | null = null;
  let tp2Pnl: number | null = null;
  let rrTp1 = '—';
  let rrTp2 = '—';

  if (tp1Points) {
    if (isFutures && tickSize && tickValue) {
      const tp1Ticks = tp1Points / tickSize;
      tp1Pnl = maxSize * tp1Ticks * tickValue;
    } else if (!isFutures && pipValue) {
      tp1Pnl = maxSize * tp1Points * pipValue;
    }
    const rr1 = tp1Points / slPoints;
    rrTp1 = `1:${rr1 % 1 === 0 ? rr1.toFixed(0) : rr1.toFixed(1)}`;
  }

  if (tp2Points) {
    if (isFutures && tickSize && tickValue) {
      const tp2Ticks = tp2Points / tickSize;
      tp2Pnl = maxSize * tp2Ticks * tickValue;
    } else if (!isFutures && pipValue) {
      tp2Pnl = maxSize * tp2Points * pipValue;
    }
    const rr2 = tp2Points / slPoints;
    rrTp2 = `1:${rr2 % 1 === 0 ? rr2.toFixed(0) : rr2.toFixed(1)}`;
  }

  return { riskUsd, riskPerContract: riskPerUnit, maxSize, tp1Pnl, tp2Pnl, rrTp1, rrTp2 };
}

export function PositionCalculator({ strategy, defaultBalance, defaultLeverage, onClose }: Props) {
  const isFutures = strategy.instrumentType === 'FUTURES';
  const unitLabel = isFutures ? 'contracts' : 'lots';

  const [balance, setBalance] = useState(defaultBalance?.toString() ?? '');
  const [leverage, setLeverage] = useState(defaultLeverage?.toString() ?? '');
  const [riskPct, setRiskPct] = useState(strategy.riskPercentPerTrade?.toString() ?? '1');
  const [slPoints, setSlPoints] = useState(strategy.stopLossPoints?.toString() ?? '');
  const [tp1Points, setTp1Points] = useState(strategy.tp1Points?.toString() ?? '');
  const [tp2Points, setTp2Points] = useState(strategy.tp2Points?.toString() ?? '');

  const [result, setResult] = useState<CalcResult | null>(null);

  useEffect(() => {
    const res = calcResult(
      isFutures,
      parseFloat(balance) || 0,
      parseFloat(riskPct) || 0,
      parseFloat(slPoints) || 0,
      parseFloat(tp1Points) || null,
      parseFloat(tp2Points) || null,
      strategy.tickSize ?? null,
      strategy.tickValue ?? null,
      strategy.pipValue ?? null,
    );
    setResult(res);
  }, [balance, riskPct, slPoints, tp1Points, tp2Points, isFutures, strategy]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Position Calculator</span>
            <span className="text-sm font-normal text-gray-500">— {strategy.symbol}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Account section */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Account</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calc-balance" className="text-xs text-gray-600">Balance ($)</Label>
                <Input
                  id="calc-balance"
                  type="number"
                  min="0"
                  placeholder="50000"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calc-leverage" className="text-xs text-gray-600">Leverage (e.g. 10)</Label>
                <Input
                  id="calc-leverage"
                  type="number"
                  min="1"
                  placeholder="10"
                  value={leverage}
                  onChange={(e) => setLeverage(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Strategy inputs */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Inputs ({isFutures ? 'ticks' : 'pips'})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calc-risk" className="text-xs text-gray-600">Risk %</Label>
                <Input
                  id="calc-risk"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.1"
                  value={riskPct}
                  onChange={(e) => setRiskPct(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calc-sl" className="text-xs text-gray-600">Stop Loss</Label>
                <Input
                  id="calc-sl"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={slPoints}
                  onChange={(e) => setSlPoints(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calc-tp1" className="text-xs text-gray-600">TP1</Label>
                <Input
                  id="calc-tp1"
                  type="number"
                  min="0"
                  placeholder="20"
                  value={tp1Points}
                  onChange={(e) => setTp1Points(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="calc-tp2" className="text-xs text-gray-600">TP2</Label>
                <Input
                  id="calc-tp2"
                  type="number"
                  min="0"
                  placeholder="40"
                  value={tp2Points}
                  onChange={(e) => setTp2Points(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Instrument info */}
          {isFutures && (
            <p className="text-xs text-gray-400">
              Tick: {strategy.tickSize} pts × ${strategy.tickValue}/tick/contract
            </p>
          )}
          {!isFutures && (
            <p className="text-xs text-gray-400">
              Pip value: ${strategy.pipValue}/lot
            </p>
          )}

          {/* Results */}
          {result ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 divide-y divide-gray-100 text-sm">
              <div className="flex justify-between px-4 py-2">
                <span className="text-gray-500">Risk Amount</span>
                <span className="font-semibold text-red-600">{formatUsd(result.riskUsd)}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-gray-500">Risk per {unitLabel.slice(0, -1)}</span>
                <span className="font-medium text-gray-700">{formatUsd(result.riskPerContract)}</span>
              </div>
              <div className="flex justify-between px-4 py-2 bg-blue-50 rounded-b-none">
                <span className="font-semibold text-blue-700">Max Size</span>
                <span className="font-bold text-blue-700 text-base">
                  {result.maxSize < 1 ? result.maxSize.toFixed(2) : Math.floor(result.maxSize)} {unitLabel}
                </span>
              </div>
              {result.tp1Pnl != null && (
                <div className="flex justify-between px-4 py-2">
                  <span className="text-gray-500">TP1 Profit <span className="text-gray-400">({result.rrTp1})</span></span>
                  <span className="font-semibold text-green-600">+{formatUsd(result.tp1Pnl)}</span>
                </div>
              )}
              {result.tp2Pnl != null && (
                <div className="flex justify-between px-4 py-2">
                  <span className="text-gray-500">TP2 Profit <span className="text-gray-400">({result.rrTp2})</span></span>
                  <span className="font-semibold text-emerald-600">+{formatUsd(result.tp2Pnl)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-400">
              Enter balance, risk %, and stop loss to see results
            </div>
          )}

          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
