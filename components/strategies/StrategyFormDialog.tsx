'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createStrategySchema, type CreateStrategyInput } from '@/lib/validations';
import { INSTRUMENT_DEFAULTS, INSTRUMENT_TYPES } from '@/lib/constants';
import type { StrategyCardData } from './StrategyCard';

// Use the input type (before Zod transforms/defaults) for react-hook-form
import { z } from 'zod';
type FormValues = z.input<typeof createStrategySchema>;

const SESSION_OPTIONS = [
  { value: 'ASIA', label: 'Asia' },
  { value: 'ASIA_EUROPE_OVERLAP', label: 'Asia/EU Overlap' },
  { value: 'EUROPE', label: 'Europe' },
  { value: 'EUROPE_US_OVERLAP', label: 'EU/US Overlap' },
  { value: 'US', label: 'US' },
];

const INSTRUMENT_TYPE_OPTIONS = Object.values(INSTRUMENT_TYPES);

interface Props {
  open: boolean;
  strategy?: StrategyCardData | null; // null = create mode, defined = edit mode
  onClose: () => void;
  onSave: (data: CreateStrategyInput) => Promise<void>;
  isSaving?: boolean;
}

// Convert NaN / empty string → undefined so optional Zod number fields accept blank inputs.
// valueAsNumber:true would produce NaN which Zod rejects silently.
const asNum = (v: unknown) => {
  if (v === '' || v == null) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
};

export function StrategyFormDialog({ open, strategy, onClose, onSave, isSaving }: Props) {
  const isEdit = !!strategy;

  const form = useForm<FormValues>({
    resolver: zodResolver(createStrategySchema),
    defaultValues: {
      symbol: '',
      instrumentType: 'FUTURES',
      defaultLotSize: undefined,
      stopLossPoints: undefined,
      tp1Points: undefined,
      tp2Points: undefined,
      riskPercentPerTrade: undefined,
      maxTradesPerDay: undefined,
      tickSize: undefined,
      tickValue: undefined,
      pipValue: undefined,
      bestSessions: [],
      entryNotes: '',
      sortOrder: 0,
    },
  });

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = form;
  const instrumentType = watch('instrumentType') ?? 'FUTURES';
  const symbolValue = watch('symbol');

  // Sizing mode: FIXED (use defaultLotSize) or RISK_BASED (use riskPercentPerTrade)
  const [sizingMode, setSizingMode] = useState<'FIXED' | 'RISK_BASED'>(
    strategy?.defaultLotSize != null ? 'FIXED' : 'RISK_BASED',
  );

  function switchSizingMode(mode: 'FIXED' | 'RISK_BASED') {
    setSizingMode(mode);
    if (mode === 'FIXED') {
      setValue('riskPercentPerTrade', undefined as unknown as number);
    } else {
      setValue('defaultLotSize', undefined as unknown as number);
    }
  }

  // Populate form when editing
  useEffect(() => {
    if (strategy) {
      // Infer sizing mode from which field has a value
      setSizingMode(strategy.defaultLotSize != null ? 'FIXED' : 'RISK_BASED');
      reset({
        symbol: strategy.symbol,
        instrumentType: strategy.instrumentType as CreateStrategyInput['instrumentType'],
        defaultLotSize: strategy.defaultLotSize ?? undefined,
        stopLossPoints: strategy.stopLossPoints ?? undefined,
        tp1Points: strategy.tp1Points ?? undefined,
        tp2Points: strategy.tp2Points ?? undefined,
        riskPercentPerTrade: strategy.riskPercentPerTrade ?? undefined,
        maxTradesPerDay: strategy.maxTradesPerDay ?? undefined,
        tickSize: strategy.tickSize ?? undefined,
        tickValue: strategy.tickValue ?? undefined,
        pipValue: strategy.pipValue ?? undefined,
        bestSessions: strategy.bestSessions ?? [],
        entryNotes: strategy.entryNotes ?? '',
        sortOrder: strategy.sortOrder ?? 0,
      });
    } else {
      setSizingMode('RISK_BASED');
      reset({
        symbol: '',
        instrumentType: 'FUTURES',
        riskPercentPerTrade: 1.0,
        bestSessions: [],
      });
    }
  }, [strategy, reset]);

  // Auto-fill defaults when a known symbol is typed
  useEffect(() => {
    const upper = symbolValue?.toUpperCase().trim();
    if (!upper || isEdit) return;
    const defaults = INSTRUMENT_DEFAULTS[upper];
    if (!defaults) return;
    setValue('instrumentType', defaults.instrumentType as FormValues['instrumentType']);
    if (defaults.tickSize != null) setValue('tickSize', defaults.tickSize);
    if (defaults.tickValue != null) setValue('tickValue', defaults.tickValue);
    if (defaults.pipValue != null) setValue('pipValue', defaults.pipValue);
    if (defaults.defaultLotSize != null) setValue('defaultLotSize', defaults.defaultLotSize);
  }, [symbolValue, isEdit, setValue]);

  const selectedSessions = watch('bestSessions') ?? [];

  function toggleSession(session: string) {
    const current = selectedSessions ?? [];
    if (current.includes(session)) {
      setValue('bestSessions', current.filter((s) => s !== session));
    } else {
      setValue('bestSessions', [...current, session]);
    }
  }

  const onSubmit = async (data: FormValues) => {
    await onSave(data as CreateStrategyInput);
    onClose();
  };

  const onInvalid = (errs: unknown) => {
    console.error('[StrategyForm] Validation errors:', errs);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit — ${strategy?.symbol}` : 'New Strategy'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5 pt-1">
          {/* Symbol + Instrument Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sf-symbol" className="text-xs">Symbol *</Label>
              <Input
                id="sf-symbol"
                placeholder="MNQ"
                className="uppercase"
                {...register('symbol')}
              />
              {errors.symbol && (
                <p className="text-xs text-red-500 mt-0.5">{errors.symbol.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Known symbols auto-fill defaults</p>
            </div>
            <div>
              <Label className="text-xs">Instrument Type *</Label>
              <Select
                value={instrumentType}
              onValueChange={(v) => setValue('instrumentType', v as FormValues['instrumentType'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INSTRUMENT_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tick Settings — FUTURES */}
          {instrumentType === 'FUTURES' && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Tick Settings</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sf-ticksize" className="text-xs">Tick Size</Label>
                  <Input
                    id="sf-ticksize"
                    type="number"
                    step="any"
                    placeholder="0.25"
                    {...register('tickSize', { setValueAs: asNum })}
                  />
                  {errors.tickSize && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.tickSize.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sf-tickval" className="text-xs">Tick Value (USD)</Label>
                  <Input
                    id="sf-tickval"
                    type="number"
                    step="any"
                    placeholder="0.50"
                    {...register('tickValue', { setValueAs: asNum })}
                  />
                  {errors.tickValue && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.tickValue.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pip Value — FOREX / COMMODITY / INDEX / CRYPTO */}
          {instrumentType !== 'FUTURES' && (
            <div>
              <Label htmlFor="sf-pip" className="text-xs">Pip Value (USD per pip per lot)</Label>
              <Input
                id="sf-pip"
                type="number"
                step="any"
                placeholder="10"
                {...register('pipValue', { setValueAs: asNum })}
              />
              {errors.pipValue && (
                <p className="text-xs text-red-500 mt-0.5">{errors.pipValue.message}</p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">Broker-specific — override if needed</p>
            </div>
          )}

          {/* Position Defaults */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Position Sizing</p>
              {/* Mode toggle */}
              <div className="flex rounded-md border border-gray-300 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => switchSizingMode('FIXED')}
                  className={`px-3 py-1 font-medium transition-colors ${
                    sizingMode === 'FIXED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Fixed Size
                </button>
                <button
                  type="button"
                  onClick={() => switchSizingMode('RISK_BASED')}
                  className={`px-3 py-1 font-medium transition-colors border-l border-gray-300 ${
                    sizingMode === 'RISK_BASED'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Risk %
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sizingMode === 'FIXED' ? (
                <div>
                  <Label htmlFor="sf-lot" className="text-xs">
                    Default Size ({instrumentType === 'FUTURES' ? 'contracts' : 'lots'})
                  </Label>
                  <Input
                    id="sf-lot"
                    type="number"
                    step="any"
                    placeholder="1"
                    {...register('defaultLotSize', { setValueAs: asNum })}
                  />
                  {errors.defaultLotSize && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.defaultLotSize.message}</p>
                  )}
                </div>
              ) : (
                <div>
                  <Label htmlFor="sf-risk" className="text-xs">Risk % / Trade</Label>
                  <Input
                    id="sf-risk"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="100"
                    placeholder="1.0"
                    {...register('riskPercentPerTrade', { setValueAs: asNum })}
                  />
                  {errors.riskPercentPerTrade && (
                    <p className="text-xs text-red-500 mt-0.5">{errors.riskPercentPerTrade.message}</p>
                  )}
                </div>
              )}
              <div>
                <Label htmlFor="sf-sl" className="text-xs">
                  Stop Loss ({instrumentType === 'FUTURES' ? 'ticks' : 'pips'})
                </Label>
                <Input
                  id="sf-sl"
                  type="number"
                  step="any"
                  placeholder="10"
                  {...register('stopLossPoints', { setValueAs: asNum })}
                />
                {errors.stopLossPoints && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.stopLossPoints.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="sf-maxday" className="text-xs">Max Trades / Day</Label>
                <Input
                  id="sf-maxday"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="3"
                  {...register('maxTradesPerDay', { setValueAs: asNum })}
                />
              </div>
              <div>
                <Label htmlFor="sf-tp1" className="text-xs">
                  TP1 ({instrumentType === 'FUTURES' ? 'ticks' : 'pips'})
                </Label>
                <Input
                  id="sf-tp1"
                  type="number"
                  step="any"
                  placeholder="20"
                  {...register('tp1Points', { setValueAs: asNum })}
                />
              </div>
              <div>
                <Label htmlFor="sf-tp2" className="text-xs">
                  TP2 ({instrumentType === 'FUTURES' ? 'ticks' : 'pips'}) — optional
                </Label>
                <Input
                  id="sf-tp2"
                  type="number"
                  step="any"
                  placeholder="40"
                  {...register('tp2Points', { setValueAs: asNum })}
                />
              </div>
            </div>
          </div>

          {/* Best Sessions */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Best Sessions</p>
            <div className="flex flex-wrap gap-2">
              {SESSION_OPTIONS.map((s) => {
                const active = selectedSessions.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSession(s.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Notes */}
          <div>
            <Label htmlFor="sf-notes" className="text-xs">Entry Notes</Label>
            <Textarea
              id="sf-notes"
              placeholder="e.g. Only trade 9:30–11 AM NY open. Wait for first pullback after open drive."
              rows={3}
              className="resize-none"
              {...register('entryNotes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSaving}>
              {isSaving ? 'Saving…' : isEdit ? 'Update Strategy' : 'Save Strategy'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
