'use client';

/**
 * CSV Import Page
 * Allow users to upload and import trades from CSV file
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseCSVFile, downloadCSVTemplate, type ParsedTrade, type ValidationError } from '@/lib/utils/csvParser';
import { showToast } from '@/components/ui/Toast';
import { useTimezone } from '@/contexts/TimezoneContext';
import { useActiveAccount } from '@/contexts/ActiveAccountContext';
import { COMMON_TIMEZONES } from '@/lib/utils/timezones';
import { BadgeCelebration } from '@/components/animations/BadgeCelebration';
import { TradesPageQuote } from '@/components/quotes/TradesPageQuote';
import type { Badge } from '@/lib/db/schema';

export default function ImportTradesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { timezone: userTimezone } = useTimezone();
  const { activeAccount } = useActiveAccount();
  
  const [file, setFile] = useState<File | null>(null);
  const [importTimezone, setImportTimezone] = useState(userTimezone);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.name.endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }

    // Validate file size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      showToast('File size must be less than 5MB', 'error');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setImportSuccess(false);

    try {
      const result = await parseCSVFile(selectedFile, importTimezone);
      
      // Check max trades limit
      if (result.trades.length > 500) {
        showToast('Maximum 500 trades per file. Please split your data.', 'error');
        setFile(null);
        setIsParsing(false);
        return;
      }

      setParsedTrades(result.trades);
      setValidationErrors(result.errors);

      if (result.errors.length === 0) {
        showToast(`Successfully parsed ${result.trades.length} trades`, 'success');
      } else {
        showToast(`Found ${result.errors.length} validation errors`, 'error');
      }
    } catch (error) {
      console.error('CSV parsing error:', error);
      showToast('Failed to parse CSV file. Please check the format.', 'error');
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (parsedTrades.length === 0 || validationErrors.length > 0) {
      return;
    }

    setIsImporting(true);

    try {
      const response = await fetch('/api/trades/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trades: parsedTrades, accountId: activeAccount?.id ?? null }),
      });

      const data = await response.json();

      // Handle validation errors (400) - these are expected user errors
      // Note: Browser will still log 400 in DevTools (normal development behavior)
      if (response.status === 400) {
        showToast(data.error || 'Validation error', 'error');
        return;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportSuccess(true);
      
      // Check if badges were earned
      if (data.badges && data.badges.length > 0) {
        setEarnedBadges(data.badges);
        setShowCelebration(true);
        // Set flag to refresh achievements page
        localStorage.setItem('badgesUpdated', Date.now().toString());
        
        const successMessage = `Successfully imported ${data.imported} trades and earned ${data.badges.length} badge${data.badges.length !== 1 ? 's' : ''}! 🎉`;
        showToast(successMessage, 'success');
        
        // Refresh after celebration closes
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        showToast(`Successfully imported ${data.imported} trades!`, 'success');
        
        // Set flag for achievements page to refresh progress
        localStorage.setItem('badgesUpdated', Date.now().toString());
        
        // Reset form after successful import
        setTimeout(() => {
          router.refresh();
          router.push('/trades');
        }, 2000);
      }
    } catch (error: any) {
      // Only log unexpected errors (not validation errors)
      console.error('Unexpected import error:', error);
      showToast(error.message || 'Failed to import trades', 'error');
    } finally {
      // Always reset importing state
      setIsImporting(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setParsedTrades([]);
    setValidationErrors([]);
    setImportSuccess(false);
    setIsParsing(false);
    // Clear the file input field
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Contextual Quote - Pinned at Top */}
      <TradesPageQuote />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Trades from CSV</h1>
          <p className="mt-2 text-gray-600">
            Upload your trading history from a CSV file. Maximum 500 trades per file.
          </p>
        </div>
        <Link href="/trades">
          <Button variant="outline" className="hidden sm:flex">← Back to Trades</Button>
        </Link>
      </div>

      {/* Mobile Back Button */}
      <div className="sm:hidden mb-4">
        <Link href="/trades">
          <Button variant="outline" className="w-full">← Back to Trades</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Import Wizard</CardTitle>
          <CardDescription>
            Follow these steps to import your historical trades
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Download Template */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Download Template</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              Download our CSV template to see the required format and example data.
            </p>
            <Button
              variant="outline"
              onClick={downloadCSVTemplate}
              className="ml-11"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            <div className="ml-11 mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-sm">
              <p className="font-medium text-gray-700 mb-2">CSV Column Format:</p>
              <code className="text-xs text-gray-600 block mb-2">Date &amp; time, Type, Result, SOP, SOP Type, Amount, Symbol, Notes</code>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Type</strong>: <code>Transaction</code> (default) or <code>Commission</code> — optional, defaults to Transaction if missing</li>
                <li>• <strong>Result</strong>: <code>WIN</code> or <code>LOSS</code> — required for Transaction rows only</li>
                <li>• <strong>SOP</strong>: <code>yes</code> / <code>no</code> — required for Transaction rows only</li>
                <li>• <strong>Amount (Transaction)</strong>: positive for WIN (e.g. <code>50.00</code>), negative for LOSS (e.g. <code>-10.00</code>)</li>
                <li>• <strong>Amount (Commission)</strong>: must be <strong>negative</strong> (e.g. <code>-3.50</code>) — broker fee / swap charge</li>
                <li>• Commission rows: leave Result, SOP, SOP Type blank — only Date &amp; time, Type, Amount are required</li>
              </ul>
            </div>
          </div>

          {/* Step 1.5: Select Timezone */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
                🌍
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Select Import Timezone</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              Choose the timezone of the timestamps in your CSV file.
            </p>
            <div className="ml-11 space-y-2">
              <Label htmlFor="importTimezone">Import Timezone</Label>
              <select
                id="importTimezone"
                value={importTimezone}
                onChange={(e) => setImportTimezone(e.target.value)}
                disabled={isParsing || isImporting || importSuccess}
                className="w-full max-w-md rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label} {tz.value === userTimezone && '(Your Setting)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                CSV timestamps will be interpreted as {importTimezone} and converted to UTC
              </p>
            </div>
          </div>

          {/* Step 2: Upload File */}
          <div className="border-b pb-6">
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Upload Your CSV</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3 ml-11">
              Select your CSV file containing trade data. File must be less than 5MB.
            </p>
            <div className="ml-11">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isParsing || isImporting || importSuccess}
                className="max-w-md"
              />
              {file && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
          </div>

          {/* Step 3: Preview & Validate */}
          {(parsedTrades.length > 0 || validationErrors.length > 0) && (
            <div className="border-b pb-6">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
                  3
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Preview & Validate</h3>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive" className="ml-11 mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Validation Errors ({validationErrors.length})</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-48 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1">
                        {validationErrors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-sm">
                            <strong>Row {error.row}</strong> - {error.field}: {error.message}
                          </li>
                        ))}
                        {validationErrors.length > 10 && (
                          <li className="text-sm italic">
                            ... and {validationErrors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                    <p className="mt-3 text-sm">
                      Please fix these errors in your CSV file and upload again.
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Success Preview */}
              {parsedTrades.length > 0 && validationErrors.length === 0 && (
                <div className="ml-11">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Validation Passed</AlertTitle>
                    <AlertDescription className="text-green-700">
                      Found {parsedTrades.length} valid trades ready to import
                    </AlertDescription>
                  </Alert>

                  {/* Preview Table */}
                  <div className="mt-4 overflow-x-auto">
                    <p className="text-sm text-gray-600 mb-2">
                      Preview (showing first 10 trades):
                    </p>
                    <table className="min-w-full divide-y divide-gray-200 border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SOP</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedTrades.slice(0, 10).map((trade, index) => (
                          <tr key={index} className={trade.entryType === 'COMMISSION' ? 'bg-amber-50/40' : ''}>
                            <td className="px-3 py-2 text-sm">
                              {trade.entryType === 'COMMISSION' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">💳 Commission</span>
                              ) : (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">📈 Transaction</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                              {new Date(trade.tradeTimestamp).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              {trade.entryType === 'COMMISSION' ? (
                                <span className="text-gray-400">—</span>
                              ) : trade.result === 'BE' ? (
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  ⚖️ BE
                                </span>
                              ) : (
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                  trade.result === 'WIN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {trade.result}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {trade.entryType === 'COMMISSION' ? (
                                <span className="text-gray-400">—</span>
                              ) : (
                                trade.sopFollowed ? '✓ Yes' : '✗ No'
                              )}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {trade.symbol || '—'}
                            </td>
                            <td className={`px-3 py-2 text-sm text-right font-semibold ${
                              trade.profitLossUsd > 0 ? 'text-green-600' : trade.profitLossUsd < 0 ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {trade.profitLossUsd > 0 ? '+' : ''}${trade.profitLossUsd.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Import */}
          <div>
            <div className="flex items-center mb-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
                4
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Import Trades</h3>
            </div>
            
            <div className="ml-11 flex gap-3">
              <Button
                onClick={handleImport}
                disabled={parsedTrades.length === 0 || validationErrors.length > 0 || isImporting || importSuccess}
                className="min-w-[200px]"
              >
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {importSuccess && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isImporting ? 'Importing...' : importSuccess ? 'Import Complete!' : `Import ${parsedTrades.length} Trades`}
              </Button>

              {file && !importSuccess && (
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isImporting}
                >
                  Reset
                </Button>
              )}
            </div>

            {importSuccess && (
              <Alert className="ml-11 mt-4 border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Import Successful!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your trades have been imported. Redirecting to trades list...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">CSV Format Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li><strong>Date & time</strong>: MM/DD/YYYY HH:MM format (e.g., 1/12/2026 08:30)</li>
            <li><strong>Type</strong>: <code>Transaction</code> or <code>Commission</code> (optional, defaults to Transaction)</li>
            <li><strong>Result</strong>: WIN, LOSS, or BE (break-even, case-insensitive) — Transaction rows only. Use BE with Amount = 0</li>
            <li><strong>SOP</strong>: YES or NO (case-insensitive) — Transaction rows only</li>
            <li><strong>SOP Type</strong>: Optional (e.g., BB Mastery, W & M breakout)</li>
            <li><strong>Amount</strong>: Positive for WIN, negative for LOSS. <strong>Commission must be negative</strong> (e.g., -3.50)</li>
            <li><strong>Symbol</strong>: Optional trading symbol (2-10 uppercase characters)</li>
            <li><strong>Notes</strong>: Optional trade notes (max 500 characters)</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500 italic">
            Tip: Download the template to see examples and ensure your file matches the format.
          </p>
        </CardContent>
      </Card>

      {/* Badge Celebration Animation */}
      <BadgeCelebration 
        badges={earnedBadges}
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          // Redirect to achievements page to see new badges
          router.push('/dashboard/achievements');
        }}
      />
    </div>
  );
}
