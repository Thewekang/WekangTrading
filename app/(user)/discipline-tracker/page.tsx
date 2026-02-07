'use client';

import { useEffect, useState } from 'react';
import { SettingsPanel } from '@/components/discipline-tracker/SettingsPanel';
import { StatsDisplay } from '@/components/discipline-tracker/StatsDisplay';
import { FilterBar } from '@/components/discipline-tracker/FilterBar';
import { TrackerTable } from '@/components/discipline-tracker/TrackerTable';
import { AddRowDialog } from '@/components/discipline-tracker/AddRowDialog';
import { Shield } from 'lucide-react';
import type { DisciplineTrackerSettings, DisciplineTrackerRow } from '@/lib/db/schema';
import type { AggregatedStats } from '@/lib/types/disciplineTracker';
import type { DisciplineTrackerRowInput } from '@/lib/validations/disciplineTracker';
import { aggregateRows } from '@/lib/services/disciplineTrackerRulesEngine';
import { useDisciplineQuote } from '@/lib/hooks/useQuoteHooks';
import { toast } from 'sonner';

export default function DisciplineTrackerPage() {
  const { showDisciplineQuote, showPatienceQuote, showOvertradinQuote } = useDisciplineQuote();
  const [settings, setSettings] = useState<DisciplineTrackerSettings | null>(null);
  const [rows, setRows] = useState<DisciplineTrackerRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<DisciplineTrackerRow[]>([]);
  const [stats, setStats] = useState<AggregatedStats>({
    totalPnl: 0,
    totalWins: 0,
    totalLosses: 0,
    totalBE: 0,
    totalTrades: 0,
    winRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Fetch settings and rows on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Recalculate stats when filtered rows or settings change
  useEffect(() => {
    if (settings) {
      const newStats = aggregateRows(filteredRows, settings);
      setStats(newStats);
    }
  }, [filteredRows, settings]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch settings
      const settingsRes = await fetch('/api/discipline-tracker/settings');
      const settingsData = await settingsRes.json();
      
      if (settingsData.success) {
        setSettings(settingsData.data);
      }

      // Fetch rows
      const rowsRes = await fetch('/api/discipline-tracker/rows');
      const rowsData = await rowsRes.json();
      
      if (rowsData.success) {
        setRows(rowsData.data);
        setFilteredRows(rowsData.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load discipline tracker');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async (updates: Partial<DisciplineTrackerSettings>) => {
    try {
      const res = await fetch('/api/discipline-tracker/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
        toast.success('Settings updated successfully');
      } else {
        throw new Error(data.error?.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast.error('Failed to update settings');
      throw error;
    }
  };

  const handleFilterChange = async (filters: {
    month?: string;
    search?: string;
    sortBy?: string;
  }) => {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.search) params.append('search', filters.search);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);

      const res = await fetch(`/api/discipline-tracker/rows?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setFilteredRows(data.data);
      }
    } catch (error) {
      console.error('Failed to filter rows:', error);
      toast.error('Failed to apply filters');
    }
  };

  const handleAddRow = async (input: DisciplineTrackerRowInput) => {
    try {
      const res = await fetch('/api/discipline-tracker/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (data.success) {
        setRows([data.data, ...rows]);
        setFilteredRows([data.data, ...filteredRows]);
        toast.success('Day added successfully');
        setAddDialogOpen(false);
      } else {
        // Handle specific error codes
        if (data.error?.code === 'DUPLICATE_DATE') {
          toast.error('A row for this date already exists');
        } else {
          toast.error(data.error?.message || 'Failed to add row');
        }
        // Don't throw - let the dialog stay open for user to fix
        return;
      }
    } catch (error) {
      console.error('Failed to add row:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleUpdateRow = async (id: string, updates: Partial<DisciplineTrackerRow>) => {
    try {
      const res = await fetch(`/api/discipline-tracker/rows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (data.success) {
        setRows(rows.map((r) => (r.id === id ? data.data : r)));
        setFilteredRows(filteredRows.map((r) => (r.id === id ? data.data : r)));
        
        // Show discipline quote if breaking rules (trade 2 or 3 with LOSS)
        if (updates.trade2Outcome === 'LOSS' || updates.trade3Outcome === 'LOSS') {
          showOvertradinQuote();
        } else if (updates.trade1Outcome === 'LOSS' && (updates.trade2Outcome || updates.trade3Outcome)) {
          showPatienceQuote();
        }
        // Don't show toast on every update to avoid noise
      } else {
        throw new Error(data.error?.message || 'Failed to update row');
      }
    } catch (error) {
      console.error('Failed to update row:', error);
      toast.error('Failed to update row');
      throw error;
    }
  };

  const handleDeleteRow = async (id: string) => {
    try {
      const res = await fetch(`/api/discipline-tracker/rows/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setRows(rows.filter((r) => r.id !== id));
        setFilteredRows(filteredRows.filter((r) => r.id !== id));
        toast.success('Day deleted successfully');
      } else {
        throw new Error(data.error?.message || 'Failed to delete row');
      }
    } catch (error) {
      console.error('Failed to delete row:', error);
      toast.error('Failed to delete row');
      throw error;
    }
  };

  const handleDuplicateRow = async (row: DisciplineTrackerRow) => {
    try {
      // Create new row with same settings but incremented date
      const newDate = new Date(row.tradeDate);
      newDate.setDate(newDate.getDate() + 1);

      const input: DisciplineTrackerRowInput = {
        tradeDate: newDate.toISOString().split('T')[0],
        sessionWindow: row.sessionWindow,
        isAPlusDay: row.isAPlusDay,
        isRangeExpansionDay: row.isRangeExpansionDay,
        notes: row.notes || undefined,
      };

      await handleAddRow(input);
    } catch (error) {
      console.error('Failed to duplicate row:', error);
      toast.error('Failed to duplicate row');
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading discipline tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Discipline Tracker
          </h1>
          <p className="text-muted-foreground mt-1">Rules before results</p>
        </div>
      </div>

      {/* Settings Panel */}
      <SettingsPanel settings={settings} onUpdate={handleUpdateSettings} />

      {/* Filter Bar */}
      <FilterBar onFilterChange={handleFilterChange} />

      {/* Stats Display */}
      <StatsDisplay stats={stats} />

      {/* Tracker Table */}
      <TrackerTable
        rows={filteredRows}
        settings={settings}
        onUpdate={handleUpdateRow}
        onDelete={handleDeleteRow}
        onDuplicate={handleDuplicateRow}
        onAddRow={() => setAddDialogOpen(true)}
      />

      {/* Add Row Dialog */}
      <AddRowDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSubmit={handleAddRow}
      />

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        <p>Total rows in database: {rows.length}</p>
        <p>Filtered rows: {filteredRows.length}</p>
      </div>
    </div>
  );
}
