'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Upload, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message?: string;
  imported?: number;
  errors?: string[];
  error?: { code: string; message: string };
}

export default function EconomicCalendarAdminPage() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchLastSync();
  }, []);

  const fetchLastSync = async () => {
    try {
      const response = await fetch('/api/calendar?type=today');
      const data = await response.json();
      if (data.success && data.data.lastSync) {
        setLastSync(new Date(data.data.lastSync));
      }
    } catch (error) {
      console.error('Error fetching last sync:', error);
    }
  };

  const handleSyncFromAPI = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/admin/economic-calendar/sync?action=api', {
        method: 'POST',
      });
      
      const data = await response.json();
      setSyncResult(data);

      if (data.success) {
        await fetchLastSync();
      } else {
        console.error('❌ Sync failed:', data.error);
      }
    } catch (error) {
      console.error('💥 Caught error in handleSyncFromAPI:', error);
      setSyncResult({
        success: false,
        error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportJSON = async () => {
    setIsImporting(true);
    setSyncResult(null);

    try {
      const events = JSON.parse(jsonInput);

      const response = await fetch('/api/admin/economic-calendar/sync?action=json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      const data = await response.json();
      setSyncResult(data);

      if (data.success) {
        setJsonInput('');
        await fetchLastSync();
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        setSyncResult({
          success: false,
          error: { code: 'INVALID_JSON', message: 'Invalid JSON format' },
        });
      } else {
        setSyncResult({
          success: false,
          error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const getJSONTemplate = () => {
    const template = [
      {
        eventDate: '2026-02-06',
        eventTime: '13:30:00',
        eventName: 'Non-Farm Payrolls (NFP)',
        country: 'US',
        currency: 'USD',
        indicator: 'Employment',
        importance: 'HIGH',
        forecast: '185K',
        previous: '180K',
        period: 'Jan 2026',
      },
      {
        eventDate: '2026-02-13',
        eventTime: '13:30:00',
        eventName: 'Consumer Price Index (CPI)',
        country: 'US',
        currency: 'USD',
        indicator: 'Inflation',
        importance: 'HIGH',
        forecast: '2.5%',
        previous: '2.4%',
        period: 'Jan 2026',
      },
    ];

    return JSON.stringify(template, null, 2);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Economic Calendar Management</h1>
          <p className="text-muted-foreground mt-2">
            Sync economic events from API or manually import from JSON
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/calendar'}>
          <Calendar className="mr-2 h-4 w-4" />
          View Calendar
        </Button>
      </div>

      {/* Last Sync Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Last Sync Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lastSync ? (
            <p className="text-sm">
              Last synced: <strong>{lastSync.toLocaleString()}</strong>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No sync performed yet</p>
          )}
        </CardContent>
      </Card>

      {/* Sync Result */}
      {syncResult && (
        <Alert variant={syncResult.success ? 'default' : 'destructive'}>
          {syncResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {syncResult.success
              ? syncResult.message
              : syncResult.error?.message || 'An error occurred'}
            {syncResult.errors && syncResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-sm">
                {syncResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* API Sync */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sync from RapidAPI
          </CardTitle>
          <CardDescription>
            Pull latest economic events from Ultimate Economic Calendar API (FREE tier: 10 requests/month)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <Button onClick={handleSyncFromAPI} disabled={isSyncing}>
              {isSyncing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-semibold">⚙️ Auto-Sync Schedule:</p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Weekly</Badge>
              <span>Every Monday at 00:00 UTC (via Vercel Cron)</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Automatically fetches next 14 days of US HIGH/MEDIUM importance events
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Manual JSON Import */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Manual JSON Import
          </CardTitle>
          <CardDescription>
            Import economic events manually when API quota is exhausted
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Events JSON{' '}
              <button
                type="button"
                onClick={() => setJsonInput(getJSONTemplate())}
                className="text-blue-600 hover:underline text-xs"
              >
                (Load Template)
              </button>
            </label>
            <Textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON array of events here..."
              rows={12}
              className="font-mono text-xs"
            />
          </div>

          <Button onClick={handleImportJSON} disabled={isImporting || !jsonInput.trim()}>
            {isImporting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import JSON
              </>
            )}
          </Button>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-semibold">📋 JSON Format Requirements:</p>
            <ul className="list-disc list-inside text-muted-foreground text-xs space-y-1">
              <li>
                <strong>eventDate</strong>: YYYY-MM-DD format (required)
              </li>
              <li>
                <strong>eventTime</strong>: HH:mm:ss UTC format (optional)
              </li>
              <li>
                <strong>eventName</strong>: Event title (required)
              </li>
              <li>
                <strong>importance</strong>: HIGH, MEDIUM, or LOW (required)
              </li>
              <li>
                <strong>forecast</strong>, <strong>previous</strong>: Expected/previous values
                (optional)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Usage Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            ✅ <strong>Weekly Auto-Sync:</strong> Events are automatically synced every Monday
          </p>
          <p>
            ✅ <strong>Manual Sync:</strong> Use the &quot;Sync Now&quot; button for emergency
            updates
          </p>
          <p>
            ✅ <strong>API Quota:</strong> FREE tier allows 10 requests/month (~2-3 manual syncs
            buffer)
          </p>
          <p>
            ✅ <strong>JSON Fallback:</strong> Import manually when API quota is exhausted
          </p>
          <p>
            ✅ <strong>Major Events:</strong> NFP, CPI, FOMC are scheduled months in advance (stable
            calendar)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
