'use client';

/**
 * Export Modal Component
 * Allows users to export trades in various formats
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: {
    startDate?: string;
    endDate?: string;
    result?: string;
    marketSession?: string;
    sopFollowed?: string;
    minProfitLoss?: string;
    maxProfitLoss?: string;
  };
}

export function ExportModal({ isOpen, onClose, currentFilters }: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [useCurrentFilters, setUseCurrentFilters] = useState(true);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customResult, setCustomResult] = useState('');
  const [customSession, setCustomSession] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const filters = useCurrentFilters ? currentFilters : {
        startDate: customStartDate || undefined,
        endDate: customEndDate || undefined,
        result: customResult || undefined,
        marketSession: customSession || undefined,
      };

      if (exportFormat === 'csv') {
        // CSV Export
        const params = new URLSearchParams();
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.result) params.append('result', filters.result);
        if (filters.marketSession) params.append('marketSession', filters.marketSession);
        if (filters.sopFollowed) params.append('sopFollowed', filters.sopFollowed);
        if (filters.minProfitLoss) params.append('minProfitLoss', filters.minProfitLoss);
        if (filters.maxProfitLoss) params.append('maxProfitLoss', filters.maxProfitLoss);

        const response = await fetch(`/api/export/csv?${params.toString()}`);
        
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'trades.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast.success('CSV exported successfully!');
          onClose();
        } else {
          const data = await response.json();
          toast.error(data.error?.message || 'Export failed');
        }
      } else {
        // PDF Export
        const response = await fetch('/api/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filters),
        });

        const data = await response.json();
        
        if (data.success) {
          // Open PDF in new window for printing
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(data.data.html);
            printWindow.document.close();
            
            // Wait for content to load, then trigger print dialog
            printWindow.onload = () => {
              setTimeout(() => {
                printWindow.print();
              }, 500);
            };
            
            toast.success('PDF report opened! Use browser print to save.');
          } else {
            toast.error('Please allow pop-ups to view PDF report');
          }
          
          onClose();
        } else {
          toast.error(data.error?.message || 'Failed to generate PDF');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b p-6">
          <h2 className="text-2xl font-bold text-gray-900">📊 Export Trades</h2>
          <p className="text-sm text-gray-600 mt-1">
            Download your trading data in CSV or PDF format
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setExportFormat('csv')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  exportFormat === 'csv'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">📄</div>
                <div className="font-semibold text-gray-900">CSV</div>
                <div className="text-xs text-gray-600 mt-1">
                  Excel-compatible spreadsheet
                </div>
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">📋</div>
                <div className="font-semibold text-gray-900">PDF Report</div>
                <div className="text-xs text-gray-600 mt-1">
                  Professional summary report
                </div>
              </button>
            </div>
          </div>

          {/* Filter Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Data to Export
            </label>
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="radio"
                  checked={useCurrentFilters}
                  onChange={() => setUseCurrentFilters(true)}
                  className="mt-1 mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">Use Current Filters</div>
                  <div className="text-sm text-gray-600">
                    Export trades based on your current filter settings
                  </div>
                  {Object.keys(currentFilters).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {currentFilters.startDate && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          From: {new Date(currentFilters.startDate).toLocaleDateString()}
                        </span>
                      )}
                      {currentFilters.endDate && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          To: {new Date(currentFilters.endDate).toLocaleDateString()}
                        </span>
                      )}
                      {currentFilters.result && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                          {currentFilters.result}
                        </span>
                      )}
                      {currentFilters.marketSession && (
                        <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded">
                          {currentFilters.marketSession}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start">
                <input
                  type="radio"
                  checked={!useCurrentFilters}
                  onChange={() => setUseCurrentFilters(false)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Custom Date Range</div>
                  <div className="text-sm text-gray-600 mb-3">
                    Specify a custom date range for export
                  </div>
                  
                  {!useCurrentFilters && (
                    <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Result (Optional)
                          </label>
                          <select
                            value={customResult}
                            onChange={(e) => setCustomResult(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">All Results</option>
                            <option value="WIN">Wins Only</option>
                            <option value="LOSS">Losses Only</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Session (Optional)
                          </label>
                          <select
                            value={customSession}
                            onChange={(e) => setCustomSession(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">All Sessions</option>
                            <option value="ASIA">Asia</option>
                            <option value="EUROPE">Europe</option>
                            <option value="US">US</option>
                            <option value="OVERLAP">Overlap</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3 text-xl">ℹ️</div>
              <div className="text-sm text-blue-900">
                {exportFormat === 'csv' ? (
                  <>
                    <strong>CSV Export:</strong> Download a spreadsheet file that can be opened in Excel, Google Sheets, or any spreadsheet application. Perfect for further analysis or backup.
                  </>
                ) : (
                  <>
                    <strong>PDF Report:</strong> Generate a professional report with summary statistics, session breakdown, and detailed trade list. Your browser's print dialog will open for saving as PDF.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Exporting...
              </>
            ) : (
              <>
                📥 Export {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
