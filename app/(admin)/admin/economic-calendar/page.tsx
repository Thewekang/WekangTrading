'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Upload, Calendar, AlertCircle, CheckCircle2, Clock, History, Timer, XCircle } from 'lucide-react';

interface SyncResult {
  success: boolean;
  message?: string;
  imported?: number;
  errors?: string[];
  error?: { code: string; message: string };
}

interface CronLog {
  id: string;
  jobName: string;
  status: 'SUCCESS' | 'ERROR' | 'RUNNING';
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  message: string | null;
  itemsProcessed: number | null;
  errorCode: string | null;
  errorMessage: string | null;
}

interface CronLogsResponse {
  logs: CronLog[];
  nextRun: string;
  timeUntilNextRun: number;
  schedule: {
    time: string;
    days: string;
    cron: string;
  };
}

export default function EconomicCalendarAdminPage() {
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [cronData, setCronData] = useState<CronLogsResponse | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    fetchLastSync();
    fetchCronLogs();
    
    // Refresh cron logs every 30 seconds
    const interval = setInterval(fetchCronLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!cronData) return;

    const updateCountdown = () => {
      const now = Date.now();
      const nextRun = new Date(cronData.nextRun).getTime();
      const diff = nextRun - now;

      if (diff <= 0) {
        setCountdown('Running soon...');
        fetchCronLogs(); // Refresh to get new next run time
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      setCountdown(parts.join(' '));
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [cronData]);

  const fetchCronLogs = async () => {
    try {
      const response = await fetch('/api/admin/economic-calendar/cron-logs?limit=10');
      const data = await response.json();
      if (data.success) {
        setCronData(data.data);
      }
    } catch (error) {
      console.error('Error fetching cron logs:', error);
    }
  };

  const fetchLastSync = async () => {
    try {
      const response = await fetch('/api/calendar?type=today');
      const data = await response.json();
      if (data.success && data.lastSync) {
        setLastSync(new Date(data.lastSync));
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
        await fetchCronLogs(); // Refresh logs after manual sync
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/admin/economic-calendar/view'}>
            <Calendar className="mr-2 h-4 w-4" />
            View Calendar
          </Button>
        </div>
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

      {/* Cron Job Status & Countdown */}
      {cronData && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              Next Scheduled Sync
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next Run</p>
                <p className="text-lg font-semibold">
                  {new Date(cronData.nextRun).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Countdown</p>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">
                  {countdown}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-white">
                {cronData.schedule.time}
              </Badge>
              <Badge variant="outline" className="bg-white">
                {cronData.schedule.days}
              </Badge>
              <Badge variant="outline" className="bg-white font-mono text-xs">
                {cronData.schedule.cron}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cron Execution History */}
      {cronData && cronData.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Execution History (Last 10 Runs)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cronData.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {log.status === 'SUCCESS' && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {log.status === 'ERROR' && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {log.status === 'RUNNING' && (
                      <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {log.message || 'No message'}
                      </p>
                      <Badge
                        variant={
                          log.status === 'SUCCESS'
                            ? 'default'
                            : log.status === 'ERROR'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className="shrink-0"
                      >
                        {log.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Started: {new Date(log.startedAt).toLocaleString()}
                      </span>
                      {log.duration && (
                        <span>Duration: {(log.duration / 1000).toFixed(2)}s</span>
                      )}
                      {log.itemsProcessed !== null && (
                        <span>Items: {log.itemsProcessed}</span>
                      )}
                    </div>
                    {log.errorMessage && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          <strong>{log.errorCode}:</strong> {log.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Badge variant="outline">Weekdays Only</Badge>
              <span>Mon-Fri at 05:00 UTC / 00:00 EST (Midnight US Eastern)</span>
            </div>
            <p className="text-muted-foreground text-xs">
              Automatically fetches next 7 days of US HIGH importance events (~22 requests/month within 50 limit)
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
            ✅ <strong>Weekday Auto-Sync:</strong> Events synced Mon-Fri at midnight EST (05:00 UTC)
          </p>
          <p>
            ✅ <strong>Manual Sync:</strong> Use the &quot;Sync Now&quot; button for emergency
            updates
          </p>
          <p>
            ✅ <strong>API Quota:</strong> 50 requests/month limit (~22 used for auto-sync, 28 buffer)
          </p>
          <p>
            ✅ <strong>JSON Fallback:</strong> Import manually when API quota is exhausted
          </p>
          <p>
            ✅ <strong>US Market Focus:</strong> Aligned with US trading day start time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
