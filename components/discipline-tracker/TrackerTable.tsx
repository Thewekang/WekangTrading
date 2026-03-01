'use client';

import { useState, useRef } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Info } from 'lucide-react';
import { TradeCell } from './TradeCell';
import { TP3Input } from './TP3Input';
import { OutcomeValueDisplay } from './OutcomeValueDisplay';
import { RowActions } from './RowActions';
import { TrackerCardMobile } from './TrackerCardMobile';
import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';
import type { EvaluatedRow } from '@/lib/types/disciplineTracker';
import { evaluateDayRow } from '@/lib/services/disciplineTrackerRulesEngine';
import type { TradeOutcome } from '@/lib/validations/disciplineTracker';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface TrackerTableProps {
  rows: DisciplineTrackerRow[];
  settings: DisciplineTrackerSettings;
  onUpdate: (rowId: string, updates: Partial<DisciplineTrackerRow>) => Promise<void>;
  onDelete: (rowId: string) => Promise<void>;
  onDuplicate: (row: DisciplineTrackerRow) => Promise<void>;
  onAddRow: () => void;
}

export function TrackerTable({ rows, settings, onUpdate, onDelete, onDuplicate, onAddRow }: TrackerTableProps) {
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [notesValues, setNotesValues] = useState<Record<string, string>>({});
  const notesTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Evaluate all rows
  const evaluatedRows: EvaluatedRow[] = rows.map((row) => ({
    ...row,
    evaluation: evaluateDayRow(row, settings),
  }));

  const handleTradeChange = async (
    rowId: string,
    row: DisciplineTrackerRow,
    tradeNumber: 1 | 2 | 3,
    newOutcome: TradeOutcome
  ) => {
    // Convert "EMPTY" to empty string
    const normalizedOutcome = newOutcome === 'EMPTY' ? '' : newOutcome;
    const updates: Partial<DisciplineTrackerRow> = {};

    if (tradeNumber === 1) {
      updates.trade1Outcome = normalizedOutcome;
      // Auto-clear Trade 2 and 3 if they become invalid
      const tempRow = { ...row, trade1Outcome: normalizedOutcome };
      const evaluation = evaluateDayRow(tempRow, settings);
      
      if (!evaluation.allowedTrade2 && row.trade2Outcome) {
        updates.trade2Outcome = '';
        updates.trade2Tp3Amount = 0;
        toast.info('Trade 2 cleared due to rule changes');
      }
      if (!evaluation.allowedTrade3 && row.trade3Outcome) {
        updates.trade3Outcome = '';
        updates.trade3Tp3Amount = 0;
        toast.info('Trade 3 cleared due to rule changes');
      }
    } else if (tradeNumber === 2) {
      updates.trade2Outcome = normalizedOutcome;
      // Auto-clear Trade 3 if it becomes invalid
      const tempRow = { ...row, trade2Outcome: normalizedOutcome };
      const evaluation = evaluateDayRow(tempRow, settings);
      
      if (!evaluation.allowedTrade3 && row.trade3Outcome) {
        updates.trade3Outcome = '';
        updates.trade3Tp3Amount = 0;
        toast.info('Trade 3 cleared due to rule changes');
      }
    } else {
      updates.trade3Outcome = normalizedOutcome;
    }

    await onUpdate(rowId, updates);
  };

  const handleTP3AmountChange = async (
    rowId: string,
    tradeNumber: 1 | 2 | 3,
    amount: number
  ) => {
    const updates: Partial<DisciplineTrackerRow> = {};
    
    if (tradeNumber === 1) {
      updates.trade1Tp3Amount = amount;
    } else if (tradeNumber === 2) {
      updates.trade2Tp3Amount = amount;
    } else {
      updates.trade3Tp3Amount = amount;
    }

    await onUpdate(rowId, updates);
  };

  const handleToggleChange = async (
    rowId: string,
    field: 'isAPlusDay' | 'isRangeExpansionDay',
    value: boolean
  ) => {
    // Get fresh row data from current rows
    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow) return;
    
    const updates: Partial<DisciplineTrackerRow> = { [field]: value };

    // Auto-clear trades if they become invalid
    const tempRow = { ...currentRow, [field]: value };
    const evaluation = evaluateDayRow(tempRow, settings);

    if (!evaluation.allowedTrade2 && currentRow.trade2Outcome) {
      updates.trade2Outcome = '';
      updates.trade2Tp3Amount = 0;
      toast.info('Trade 2 cleared due to rule changes');
    }
    if (!evaluation.allowedTrade3 && currentRow.trade3Outcome) {
      updates.trade3Outcome = '';
      updates.trade3Tp3Amount = 0;
      toast.info('Trade 3 cleared due to rule changes');
    }

    await onUpdate(rowId, updates);
  };

  const handleSessionChange = async (
    rowId: string,
    row: DisciplineTrackerRow,
    value: 'prime' | 'non-prime'
  ) => {
    const updates: Partial<DisciplineTrackerRow> = { sessionWindow: value };

    // Auto-clear Trade 3 if it becomes invalid
    const tempRow = { ...row, sessionWindow: value };
    const evaluation = evaluateDayRow(tempRow, settings);

    if (!evaluation.allowedTrade3 && row.trade3Outcome) {
      updates.trade3Outcome = '';
      updates.trade3Tp3Amount = 0;
      toast.info('Trade 3 cleared due to rule changes');
    }

    await onUpdate(rowId, updates);
  };

  const handleNotesChange = (rowId: string, notes: string) => {
    // Update local state immediately for responsive UI
    setNotesValues(prev => ({ ...prev, [rowId]: notes }));
    
    // Clear existing timeout
    if (notesTimeoutRef.current[rowId]) {
      clearTimeout(notesTimeoutRef.current[rowId]);
    }
    
    // Set new timeout to update after 500ms of no typing
    notesTimeoutRef.current[rowId] = setTimeout(async () => {
      await onUpdate(rowId, { notes });
      // Clear the cached value after successful update
      setNotesValues(prev => {
        const newValues = { ...prev };
        delete newValues[rowId];
        return newValues;
      });
    }, 500);
  };

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">No entries yet. Add your first trading day to start tracking discipline!</p>
        <Button onClick={onAddRow} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add New Day
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={onAddRow}>
          <Plus className="h-5 w-5 mr-2" />
          Add New Day
        </Button>
      </div>

      {/* Mobile View - Cards (below md breakpoint) */}
      <div className="md:hidden space-y-4">
        {evaluatedRows.map((evaluatedRow) => {
          const { ...row } = evaluatedRow;
          return (
            <TrackerCardMobile
              key={row.id}
              evaluatedRow={evaluatedRow}
              settings={settings}
              onTradeChange={handleTradeChange}
              onTP3AmountChange={handleTP3AmountChange}
              onToggleChange={handleToggleChange}
              onSessionChange={handleSessionChange}
              onNotesChange={handleNotesChange}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              notesValue={notesValues[row.id]}
            />
          );
        })}
      </div>

      {/* Desktop View - Table (md breakpoint and above) */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[150px]">Notes</TableHead>
              <TableHead className="w-[140px]">Trade 1</TableHead>
              <TableHead className="w-[140px]">Trade 2</TableHead>
              <TableHead className="w-[140px]">Trade 3</TableHead>
              <TableHead className="w-[80px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help flex items-center gap-1 justify-center">
                      <span>A+</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">A+ Setup Confirmed: High-probability trade setup that allows Trade 2 after Trade 1 BE/SL</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-[80px]">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="cursor-help flex items-center gap-1 justify-center">
                      <span>REx</span>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Range Expansion: Market condition required for Trade 3 (along with double BE + Prime session)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableHead>
              <TableHead className="w-[100px]">Session</TableHead>
              <TableHead className="w-[100px] text-right">Day P&L</TableHead>
              <TableHead className="w-[80px] text-center">W/L/BE</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evaluatedRows.map((evaluatedRow) => {
              const { evaluation, ...row } = evaluatedRow;
              const showTP3InputTrade1 =
                settings.tp3Mode === 'manual' && row.trade1Outcome === 'TP3';
              const showTP3InputTrade2 =
                settings.tp3Mode === 'manual' && row.trade2Outcome === 'TP3';
              const showTP3InputTrade3 =
                settings.tp3Mode === 'manual' && row.trade3Outcome === 'TP3';
              
              // Helper function to get outcome value from settings
              const getOutcomeValue = (outcome: string | null) => {
                if (!outcome || outcome === 'EMPTY' || outcome === '') return null;
                switch (outcome) {
                  case 'SL': return settings.slValue;
                  case 'BE': return settings.beValue;
                  case 'TP1': return settings.tp1Value;
                  case 'TP2': return settings.tp2Value;
                  case 'TP3': return settings.tp3Mode === 'fixed' ? (settings.tp3FixedValue || 240) : null;
                  default: return null;
                }
              };

              return (
                <TableRow key={row.id}>
                  {/* Date */}
                  <TableCell className="font-medium">
                    {format(new Date(row.tradeDate), 'MMM d, yyyy')}
                  </TableCell>

                  {/* Notes */}
                  <TableCell>
                    <Input
                      value={notesValues[row.id] ?? row.notes ?? ''}
                      onChange={(e) => handleNotesChange(row.id, e.target.value)}
                      placeholder="Notes..."
                      className="h-8"
                    />
                  </TableCell>

                  {/* Trade 1 */}
                  <TableCell>
                    <div className="space-y-2">
                      <TradeCell
                        value={row.trade1Outcome || 'EMPTY'}
                        onChange={(value) => handleTradeChange(row.id, row, 1, value)}
                        isLocked={false}
                        cellColor={evaluation.trade1Color}
                        tradeNumber={1}
                      />
                      {showTP3InputTrade1 ? (
                        <TP3Input
                          value={row.trade1Tp3Amount || 0}
                          onChange={(value) => handleTP3AmountChange(row.id, 1, value)}
                          isVisible={true}
                        />
                      ) : (
                        <OutcomeValueDisplay
                          value={getOutcomeValue(row.trade1Outcome) || 0}
                          isVisible={getOutcomeValue(row.trade1Outcome) !== null}
                          outcome={row.trade1Outcome as 'TP3' | 'TP2' | 'TP1' | 'BE' | 'SL'}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Trade 2 */}
                  <TableCell>
                    <div className="space-y-2">
                      <TradeCell
                        value={row.trade2Outcome || 'EMPTY'}
                        onChange={(value) => handleTradeChange(row.id, row, 2, value)}
                        isLocked={!evaluation.allowedTrade2}
                        lockReason={evaluation.lockReasonTrade2}
                        cellColor={evaluation.trade2Color}
                        tradeNumber={2}
                      />
                      {showTP3InputTrade2 ? (
                        <TP3Input
                          value={row.trade2Tp3Amount || 0}
                          onChange={(value) => handleTP3AmountChange(row.id, 2, value)}
                          isVisible={true}
                        />
                      ) : (
                        <OutcomeValueDisplay
                          value={getOutcomeValue(row.trade2Outcome) || 0}
                          isVisible={getOutcomeValue(row.trade2Outcome) !== null}
                          outcome={row.trade2Outcome as 'TP3' | 'TP2' | 'TP1' | 'BE' | 'SL'}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* Trade 3 */}
                  <TableCell>
                    <div className="space-y-2">
                      <TradeCell
                        value={row.trade3Outcome || 'EMPTY'}
                        onChange={(value) => handleTradeChange(row.id, row, 3, value)}
                        isLocked={!evaluation.allowedTrade3}
                        lockReason={evaluation.lockReasonTrade3}
                        cellColor={evaluation.trade3Color}
                        tradeNumber={3}
                      />
                      {showTP3InputTrade3 ? (
                        <TP3Input
                          value={row.trade3Tp3Amount || 0}
                          onChange={(value) => handleTP3AmountChange(row.id, 3, value)}
                          isVisible={true}
                        />
                      ) : (
                        <OutcomeValueDisplay
                          value={getOutcomeValue(row.trade3Outcome) || 0}
                          isVisible={getOutcomeValue(row.trade3Outcome) !== null}
                          outcome={row.trade3Outcome as 'TP3' | 'TP2' | 'TP1' | 'BE' | 'SL'}
                        />
                      )}
                    </div>
                  </TableCell>

                  {/* A+ Confirmed */}
                  <TableCell className="text-center">
                    <Switch
                      checked={row.isAPlusDay}
                      onCheckedChange={(checked) =>
                        handleToggleChange(row.id, 'isAPlusDay', checked)
                      }
                    />
                  </TableCell>

                  {/* Range Expansion Confirmed */}
                  <TableCell className="text-center">
                    <Switch
                      checked={row.isRangeExpansionDay}
                      onCheckedChange={(checked) =>
                        handleToggleChange(row.id, 'isRangeExpansionDay', checked)
                      }
                    />
                  </TableCell>

                  {/* Session Window */}
                  <TableCell>
                    <Select
                      value={row.sessionWindow}
                      onValueChange={(value: 'prime' | 'non-prime') =>
                        handleSessionChange(row.id, row, value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prime">Prime</SelectItem>
                        <SelectItem value="non-prime">Non-Prime</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Day P&L */}
                  <TableCell className="text-right font-semibold">
                    <span
                      className={
                        evaluation.dayPnl > 0
                          ? 'text-green-600'
                          : evaluation.dayPnl < 0
                          ? 'text-rose-600'
                          : 'text-gray-600'
                      }
                    >
                      ${evaluation.dayPnl.toFixed(2)}
                    </span>
                  </TableCell>

                  {/* W/L/BE */}
                  <TableCell className="text-center text-sm">
                    <div className="flex justify-center gap-1">
                      <span className="text-green-600 font-medium">{evaluation.wins}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-rose-600 font-medium">{evaluation.losses}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-amber-600 font-medium">{evaluation.bes}</span>
                    </div>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <RowActions
                      rowId={row.id}
                      onDelete={() => onDelete(row.id)}
                      onDuplicate={() => onDuplicate(row)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}
