'use client';

/**
 * CSV Import Page
 * Allow users to upload and import trades from CSV file
 */

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Upload, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseCSVFile, downloadCSVTemplate, type ParsedTrade, type ValidationError } from '@/lib/utils/csvParser';
import { showToast } from '@/components/ui/Toast';

export default function ImportTradesPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

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
      const result = await parseCSVFile(selectedFile);
      
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
        body: JSON.stringify({ trades: parsedTrades }),
      });

      const data = await response.json();

      // Handle validation errors (400) - expected errors, show toast only
      if (response.status === 400) {
        showToast(data.error || 'Validation error', 'error');
        setIsImporting(false);
        return;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setImportSuccess(true);
      showToast(`Successfully imported ${data.imported} trades!`, 'success');

      // Reset form after successful import
      setTimeout(() => {
        router.push('/trades');
      }, 2000);
    } catch (error: any) {
      // Only log unexpected errors (not validation errors)
      console.error('Unexpected import error:', error);
      showToast(error.message || 'Failed to import trades', 'error');
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Import Trades from CSV</h1>
        <p className="mt-2 text-gray-600">
          Upload your trading history from a CSV file. Maximum 500 trades per file.
        </p>
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SOP</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedTrades.slice(0, 10).map((trade, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                              {new Date(trade.tradeTimestamp).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                trade.result === 'WIN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {trade.result}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {trade.sopFollowed ? '✓ Yes' : '✗ No'}
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              {trade.symbol || '—'}
                            </td>
                            <td className={`px-3 py-2 text-sm text-right font-semibold ${
                              trade.profitLossUsd > 0 ? 'text-green-600' : 'text-red-600'
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
            <li><strong>Result</strong>: WIN or LOSS (case-insensitive)</li>
            <li><strong>SOP</strong>: YES or NO (case-insensitive)</li>
            <li><strong>SOP Type</strong>: Optional (e.g., BB Mastery, W & M breakout)</li>
            <li><strong>Amount</strong>: Profit/loss in USD (positive or negative number)</li>
            <li><strong>Symbol</strong>: Optional trading symbol (2-10 uppercase characters)</li>
            <li><strong>Notes</strong>: Optional trade notes (max 500 characters)</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500 italic">
            Tip: Download the template to see examples and ensure your file matches the format.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
