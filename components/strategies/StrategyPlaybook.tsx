'use client';

import { useState, useCallback } from 'react';
import { Plus, BookOpen, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StrategyCard, type StrategyCardData } from '@/components/strategies/StrategyCard';
import { StrategyFormDialog } from '@/components/strategies/StrategyFormDialog';
import type { CreateStrategyInput } from '@/lib/validations';

interface Props {
  accountId: string;
  accountName: string;
  initialStrategies: StrategyCardData[];
  accountBalance?: number | null;
  calculatorLeverage?: number | null;
}

export function StrategyPlaybook({
  accountId,
  accountName,
  initialStrategies,
  accountBalance,
  calculatorLeverage,
}: Props) {
  const [strategies, setStrategies] = useState<StrategyCardData[]>(initialStrategies);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StrategyCardData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Save (create or update) ────────────────────────────────────────────
  const handleSave = useCallback(
    async (data: CreateStrategyInput) => {
      setIsSaving(true);
      setError(null);
      try {
        if (editTarget) {
          // Update
          const res = await fetch(
            `/api/trading-accounts/${accountId}/strategies/${editTarget.id}`,
            {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            },
          );
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message ?? 'Update failed');
          setStrategies((prev) =>
            prev.map((s) => (s.id === editTarget.id ? json.data : s)),
          );
        } else {
          // Create
          const res = await fetch(`/api/trading-accounts/${accountId}/strategies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error?.message ?? 'Create failed');
          setStrategies((prev) => [...prev, json.data]);
        }
        setDialogOpen(false);
        setEditTarget(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsSaving(false);
      }
    },
    [accountId, editTarget],
  );

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (strategyId: string) => {
      if (!confirm('Delete this strategy?')) return;
      try {
        const res = await fetch(
          `/api/trading-accounts/${accountId}/strategies/${strategyId}`,
          { method: 'DELETE' },
        );
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message ?? 'Delete failed');
        setStrategies((prev) => prev.filter((s) => s.id !== strategyId));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Delete failed');
      }
    },
    [accountId],
  );

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (strategy: StrategyCardData) => {
    setEditTarget(strategy);
    setDialogOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Strategy Playbook</h1>
            <p className="text-sm text-gray-500">{accountName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {(accountBalance != null || calculatorLeverage != null) && (
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              Balance: ${accountBalance?.toLocaleString() ?? '—'} · Leverage: {calculatorLeverage ?? '—'}×
            </span>
          )}
          <Button onClick={openCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Strategy
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Calculator settings nudge */}
      {accountBalance == null && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
          <Settings className="h-4 w-4 shrink-0" />
          <span>
            Set your account balance and leverage in{' '}
            <a href="settings" className="underline font-medium">Account Settings</a>{' '}
            to enable the Position Calculator.
          </span>
        </div>
      )}

      {/* Strategy grid */}
      {strategies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map((s) => (
            <StrategyCard
              key={s.id}
              strategy={s}
              accountBalance={accountBalance}
              calculatorLeverage={calculatorLeverage}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-gray-100 rounded-2xl mb-4">
            <BookOpen className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">No strategies yet</h3>
          <p className="text-sm text-gray-500 max-w-xs mb-5">
            Save your per-symbol setup rules — lot size, SL, TP1/TP2, risk %, and entry notes — for quick reference while trading.
          </p>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add your first strategy
          </Button>
        </div>
      )}

      {/* Form dialog */}
      <StrategyFormDialog
        open={dialogOpen}
        strategy={editTarget}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </>
  );
}
