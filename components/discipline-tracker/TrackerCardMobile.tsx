'use client';

'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TradeCell } from './TradeCell';
import { TP3Input } from './TP3Input';
import { RowActions } from './RowActions';
import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';
import type { EvaluatedRow } from '@/lib/types/disciplineTracker';
import type { TradeOutcome } from '@/lib/validations/disciplineTracker';
import { format } from 'date-fns';
import { Calendar, StickyNote, TrendingUp, DollarSign } from 'lucide-react';

interface TrackerCardMobileProps {
  evaluatedRow: EvaluatedRow;
  settings: DisciplineTrackerSettings;
  onTradeChange: (
    rowId: string,
    row: DisciplineTrackerRow,
    tradeNumber: 1 | 2 | 3,
    newOutcome: TradeOutcome
  ) => Promise<void>;
  onTP3AmountChange: (
    rowId: string,
    tradeNumber: 1 | 2 | 3,
    amount: number
  ) => Promise<void>;
  onToggleChange: (
    rowId: string,
    field: 'isAPlusDay' | 'isRangeExpansionDay',
    value: boolean
  ) => Promise<void>;
  onSessionChange: (
    rowId: string,
    row: DisciplineTrackerRow,
    value: 'prime' | 'non-prime'
  ) => Promise<void>;
  onNotesChange: (rowId: string, notes: string) => void;
  onDelete: (rowId: string) => void;
  onDuplicate: (row: DisciplineTrackerRow) => void;
  notesValue?: string;
}

export function TrackerCardMobile({
  evaluatedRow,
  settings,
  onTradeChange,
  onTP3AmountChange,
  onToggleChange,
  onSessionChange,
  onNotesChange,
  onDelete,
  onDuplicate,
  notesValue,
}: TrackerCardMobileProps) {
  const { evaluation, ...row } = evaluatedRow;
  const showTP3InputTrade1 =
    settings.tp3Mode === 'manual' && row.trade1Outcome === 'TP3';
  const showTP3InputTrade2 =
    settings.tp3Mode === 'manual' && row.trade2Outcome === 'TP3';
  const showTP3InputTrade3 =
    settings.tp3Mode === 'manual' && row.trade3Outcome === 'TP3';

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        {/* Header: Date and Actions */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg">
              {format(new Date(row.tradeDate), 'MMM d, yyyy')}
            </span>
          </div>
          <RowActions
            rowId={row.id}
            onDelete={() => onDelete(row.id)}
            onDuplicate={() => onDuplicate(row)}
          />
        </div>

        {/* Day Result */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Day P&L</span>
          </div>
          <span
            className={`text-xl font-bold ${
              evaluation.dayPnl > 0
                ? 'text-green-600'
                : evaluation.dayPnl < 0
                ? 'text-rose-600'
                : 'text-gray-600'
            }`}
          >
            ${evaluation.dayPnl.toFixed(2)}
          </span>
        </div>

        {/* W/L/BE Stats */}
        <div className="flex justify-around p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Wins</div>
            <div className="text-lg font-bold text-green-600">{evaluation.wins}</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">Losses</div>
            <div className="text-lg font-bold text-rose-600">{evaluation.losses}</div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">BE</div>
            <div className="text-lg font-bold text-amber-600">{evaluation.bes}</div>
          </div>
        </div>

        {/* Trades Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Trades</span>
          </div>

          {/* Trade 1 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trade 1</Label>
            <TradeCell
              value={row.trade1Outcome || 'EMPTY'}
              onChange={(value) => onTradeChange(row.id, row, 1, value)}
              isLocked={false}
              cellColor={evaluation.trade1Color}
              tradeNumber={1}
            />
            {showTP3InputTrade1 && (
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600">TP3 Amount ($)</Label>
                <TP3Input
                  value={row.trade1Tp3Amount || 0}
                  onChange={(value) => onTP3AmountChange(row.id, 1, value)}
                  isVisible={true}
                />
              </div>
            )}
          </div>

          {/* Trade 2 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trade 2</Label>
            <TradeCell
              value={row.trade2Outcome || 'EMPTY'}
              onChange={(value) => onTradeChange(row.id, row, 2, value)}
              isLocked={!evaluation.allowedTrade2}
              lockReason={evaluation.lockReasonTrade2}
              cellColor={evaluation.trade2Color}
              tradeNumber={2}
            />
            {showTP3InputTrade2 && (
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600">TP3 Amount ($)</Label>
                <TP3Input
                  value={row.trade2Tp3Amount || 0}
                  onChange={(value) => onTP3AmountChange(row.id, 2, value)}
                  isVisible={true}
                />
              </div>
            )}
          </div>

          {/* Trade 3 */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Trade 3</Label>
            <TradeCell
              value={row.trade3Outcome || 'EMPTY'}
              onChange={(value) => onTradeChange(row.id, row, 3, value)}
              isLocked={!evaluation.allowedTrade3}
              lockReason={evaluation.lockReasonTrade3}
              cellColor={evaluation.trade3Color}
              tradeNumber={3}
            />
            {showTP3InputTrade3 && (
              <div className="space-y-1">
                <Label className="text-xs text-emerald-600">TP3 Amount ($)</Label>
                <TP3Input
                  value={row.trade3Tp3Amount || 0}
                  onChange={(value) => onTP3AmountChange(row.id, 3, value)}
                  isVisible={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Session and Toggles */}
        <div className="space-y-3 pt-2 border-t">
          {/* Session Window */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Session Window</Label>
            <Select
              value={row.sessionWindow}
              onValueChange={(value: 'prime' | 'non-prime') =>
                onSessionChange(row.id, row, value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prime">Prime</SelectItem>
                <SelectItem value="non-prime">Non-Prime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* A+ Day Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">A+ Setup Confirmed</Label>
            <Switch
              checked={row.isAPlusDay}
              onCheckedChange={(checked) =>
                onToggleChange(row.id, 'isAPlusDay', checked)
              }
            />
          </div>

          {/* Range Expansion Toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-sm">Range Expansion</Label>
            <Switch
              checked={row.isRangeExpansionDay}
              onCheckedChange={(checked) =>
                onToggleChange(row.id, 'isRangeExpansionDay', checked)
              }
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <Label className="text-xs text-muted-foreground">Notes</Label>
          </div>
          <Input
            value={notesValue ?? row.notes ?? ''}
            onChange={(e) => onNotesChange(row.id, e.target.value)}
            placeholder="Add notes about this trading day..."
            className="resize-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
