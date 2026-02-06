'use client';

import { useEffect, useState } from 'react';
import { SettingsPanel } from '@/components/discipline-tracker/SettingsPanel';
import { StatsDisplay } from '@/components/discipline-tracker/StatsDisplay';
import { FilterBar } from '@/components/discipline-tracker/FilterBar';
import { Button } from '@/components/ui/button';
import { Plus, Shield } from 'lucide-react';
import type { DisciplineTrackerSettings, DisciplineTrackerRow } from '@/lib/db/schema';
import type { AggregatedStats } from '@/lib/types/disciplineTracker';
import { aggregateRows } from '@/lib/services/disciplineTrackerRulesEngine';
import { toast } from 'sonner';

export default function DisciplineTrackerPage() {
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

      {/* Table Section - Placeholder for now */}
      <div className="border-2 border-dashed rounded-lg p-12 text-center">
        <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-semibold mb-2">Tracker Table Coming Soon</h3>
        <p className="text-muted-foreground mb-6">
          The interactive table with trade entry, rule enforcement, and visual feedback will be implemented next.
        </p>
        <Button size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Add New Day
        </Button>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-muted-foreground">
        <p>Total rows in database: {rows.length}</p>
        <p>Filtered rows: {filteredRows.length}</p>
      </div>
    </div>
  );
}
